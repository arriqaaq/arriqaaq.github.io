/**
 * One-shot migration: ghost-export.json → content/posts/*.md, content/pages/*.md,
 * content/tags.yaml, content/authors.yaml.
 *
 * Reads each post's `lexical` field (Ghost's source format) — semantically
 * cleaner than the rendered `html`. Falls back to `html` (turndown) for any
 * unrecognized lexical node.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import TurndownService from 'turndown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_JSON = resolve(ROOT, 'data/ghost-export.json');
const ARCHIVE_JSON = resolve(ROOT, 'data/archive/ghost-export.json');
const POSTS_DIR = resolve(ROOT, 'content/posts');
const PAGES_DIR = resolve(ROOT, 'content/pages');
const TAGS_FILE = resolve(ROOT, 'content/tags.yaml');
const AUTHORS_FILE = resolve(ROOT, 'content/authors.yaml');

const RESERVED_SLUGS = new Set(['tag', 'author', 'page', 'rss']);

const turndown = new TurndownService({
	headingStyle: 'atx',
	codeBlockStyle: 'fenced',
	emDelimiter: '*'
});

// Override emphasis/strong so leading/trailing whitespace is moved outside
// the markers — CommonMark rejects `**foo **` because the closing `**`
// after a space isn't right-flanking. Default turndown keeps the whitespace
// inside, producing literal `**foo **` in rendered HTML.
function flank(open: string, close: string, content: string): string {
	const m = content.match(/^([\s]*)([\s\S]*?)([\s]*)$/);
	const lead = m?.[1] ?? '';
	const mid = m?.[2] ?? '';
	const trail = m?.[3] ?? '';
	if (mid === '') return lead + trail;
	return lead + open + mid + close + trail;
}
turndown.addRule('em-flanking', {
	filter: ['em', 'i'],
	replacement(content, _node, options) {
		const d = options.emDelimiter ?? '*';
		return flank(d, d, content);
	}
});
turndown.addRule('strong-flanking', {
	filter: ['strong', 'b'],
	replacement(content, _node, options) {
		const d = options.strongDelimiter ?? '**';
		return flank(d, d, content);
	}
});

type Lex = any;

// Lexical text-format bitmask
const FMT_BOLD = 1;
const FMT_ITALIC = 1 << 1;
const FMT_STRIKE = 1 << 2;
const FMT_UNDERLINE = 1 << 3;
const FMT_CODE = 1 << 4;

function rewriteImg(src: string | undefined | null): string {
	if (!src) return '';
	return src
		.replace(/__GHOST_URL__\/content\/images\/(?:size\/w\d+\/)?/g, '/images/')
		.replace(/__GHOST_URL__/g, '');
}

function escapeAttr(v: string): string {
	// Inside `:::name{key="value"}` directives, double-quote the value and
	// escape any embedded double quotes.
	return v.replace(/"/g, '\\"');
}

function escapeMd(text: string): string {
	// Minimal markdown escaping for text nodes — only chars that would otherwise
	// be parsed as markdown markup. Keep it conservative; over-escaping is ugly.
	return text
		.replace(/\\/g, '\\\\')
		.replace(/([_*`[\]<>])/g, '\\$1');
}

function renderInlines(children: Lex[]): string {
	// Merge consecutive text/extended-text nodes that share the same `format`
	// bitmask. Lexical often splits a single bold-italic phrase across multiple
	// text nodes (e.g. before/after a comma) — emitting each as its own
	// `***fragment***` produces broken markdown like `***x*** ***,*** ***y***`.
	const merged: Lex[] = [];
	for (const child of children ?? []) {
		const last = merged[merged.length - 1];
		const isTextLike = (n: Lex) => n.type === 'text' || n.type === 'extended-text';
		if (
			last &&
			isTextLike(last) &&
			isTextLike(child) &&
			(last.format ?? 0) === (child.format ?? 0)
		) {
			last.text = (last.text ?? '') + (child.text ?? '');
		} else {
			merged.push(isTextLike(child) ? { ...child } : child);
		}
	}
	let out = '';
	for (const child of merged) {
		out += renderInline(child);
	}
	return out;
}

function renderInline(node: Lex): string {
	if (!node) return '';
	const type = node.type;

	if (type === 'text' || type === 'extended-text') {
		const fmt = node.format ?? 0;
		const raw = String(node.text ?? '');
		if (fmt & FMT_CODE) return '`' + raw + '`';
		// CommonMark requires emphasis/bold delimiters to hug non-whitespace
		// content. Otherwise `***foo ***` won't close because the trailing `***`
		// after a space isn't right-flanking. Lift surrounding whitespace out.
		const m = raw.match(/^([\s]*)([\s\S]*?)([\s]*)$/);
		const lead = m?.[1] ?? '';
		const trail = m?.[3] ?? '';
		const core = m?.[2] ?? '';
		if (core === '') return raw; // pure whitespace, no formatting
		let inner = escapeMd(core);
		if (fmt & FMT_BOLD) inner = `**${inner}**`;
		if (fmt & FMT_ITALIC) inner = `*${inner}*`;
		if (fmt & FMT_STRIKE) inner = `~~${inner}~~`;
		return lead + inner + trail;
	}

	if (type === 'linebreak') return '  \n';

	if (type === 'link') {
		const url = rewriteImg(node.url ?? '');
		const text = renderInlines(node.children ?? []) || url;
		return `[${text}](${url})`;
	}

	if (type === 'extended-text' || type === 'text') {
		return escapeMd(node.text ?? '');
	}

	// Unknown inline — best effort
	if (Array.isArray(node.children)) return renderInlines(node.children);
	return '';
}

function renderListItems(items: Lex[], ordered: boolean, depth: number): string {
	const out: string[] = [];
	let n = 1;
	for (const item of items) {
		const marker = ordered ? `${n}.` : '-';
		const inline = renderInlines(item.children ?? []);
		const indent = '  '.repeat(depth);
		out.push(`${indent}${marker} ${inline}`);
		n += 1;
	}
	return out.join('\n');
}

function bookmarkDirective(node: Lex): string {
	const m = node.metadata ?? {};
	const parts: string[] = [];
	parts.push(`url="${escapeAttr(rewriteImg(node.url ?? ''))}"`);
	if (m.title) parts.push(`title="${escapeAttr(m.title)}"`);
	if (m.description) parts.push(`description="${escapeAttr(m.description)}"`);
	if (m.author) parts.push(`author="${escapeAttr(m.author)}"`);
	if (m.publisher) parts.push(`publisher="${escapeAttr(m.publisher)}"`);
	if (m.icon) parts.push(`icon="${escapeAttr(rewriteImg(m.icon))}"`);
	if (m.thumbnail) parts.push(`thumbnail="${escapeAttr(rewriteImg(m.thumbnail))}"`);
	return `::bookmark{${parts.join(' ')}}`;
}

function imageDirective(node: Lex): string {
	const parts: string[] = [];
	parts.push(`src="${escapeAttr(rewriteImg(node.src))}"`);
	if (node.alt) parts.push(`alt="${escapeAttr(node.alt)}"`);
	if (node.cardWidth && node.cardWidth !== 'regular') parts.push(`width=${node.cardWidth}`);
	if (node.caption) parts.push(`caption="${escapeAttr(node.caption.replace(/<[^>]+>/g, ''))}"`);
	if (node.href) parts.push(`href="${escapeAttr(node.href)}"`);
	return `::image{${parts.join(' ')}}`;
}

function galleryBlock(node: Lex): string {
	const lines: string[] = [];
	lines.push(':::gallery');
	for (const img of node.images ?? []) {
		lines.push(`- ${rewriteImg(img.src)}`);
	}
	lines.push(':::');
	return lines.join('\n');
}

function codeBlock(node: Lex): string {
	const lang = (node.language ?? '').trim();
	const fence = '```';
	const code = node.code ?? '';
	return `${fence}${lang}\n${code}\n${fence}`;
}

function htmlBlock(node: Lex): string {
	let html = String(node.html ?? '');

	// Detect Instagram embed blockquotes — Instagram's embed.js rewrites them
	// client-side, which is fragile under SvelteKit hydration. Replace with a
	// plain iframe pointing at Instagram's official /embed/ endpoint.
	const igMatch = html.match(
		/<blockquote[^>]*class="[^"]*instagram-media[^"]*"[^>]*data-instgrm-permalink="([^"]+)"/i
	);
	if (igMatch) {
		const permalink = igMatch[1].replace(/&amp;/g, '&').split('?')[0].replace(/\/$/, '');
		return `::embed{provider=instagram url="${escapeAttr(permalink)}/embed/"}`;
	}

	// Detect Twitter/X embeds — same story, replace with plain link card.
	const twMatch = html.match(/<blockquote[^>]*class="[^"]*twitter-tweet[^"]*"[\s\S]*?<a href="([^"]+)"/i);
	if (twMatch) {
		return `::embed{provider=twitter url="${escapeAttr(twMatch[1])}"}`;
	}

	// Strip <script> tags — they break under hydration and represent a
	// security surface we don't want to ship from old content.
	html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
	html = html.replace(/<script[^>]*\/>/gi, '');

	return rewriteImg(html);
}

function blockToMd(node: Lex): string {
	if (!node) return '';
	const type = node.type;

	switch (type) {
		case 'paragraph': {
			const inner = renderInlines(node.children ?? []);
			return inner.trim() === '' ? '' : inner;
		}
		case 'extended-heading':
		case 'heading': {
			const level = parseInt(String(node.tag ?? 'h2').slice(1), 10) || 2;
			const inner = renderInlines(node.children ?? []);
			return `${'#'.repeat(level)} ${inner}`;
		}
		case 'list': {
			const ordered = (node.listType ?? 'bullet') !== 'bullet';
			return renderListItems(node.children ?? [], ordered, 0);
		}
		case 'extended-quote':
		case 'quote': {
			// Quote children may be either block (paragraph) or inline (extended-text)
			// nodes — handle both by gathering runs of inlines into a single paragraph.
			const blocks: string[] = [];
			let inlineRun: Lex[] = [];
			const flush = () => {
				if (inlineRun.length) {
					blocks.push(renderInlines(inlineRun));
					inlineRun = [];
				}
			};
			for (const c of node.children ?? []) {
				if (isInlineType(c.type)) inlineRun.push(c);
				else {
					flush();
					blocks.push(blockToMd(c));
				}
			}
			flush();
			const inner = blocks.filter((b) => b !== '').join('\n\n');
			return inner
				.split('\n')
				.map((line) => (line.length ? `> ${line}` : '>'))
				.join('\n');
		}
		case 'horizontalrule':
			return '---';
		case 'video': {
			// Ghost stores videos under /content/media/. We treat them as plain
			// HTML5 <video> tags pointing at /media/<filename>. Drive folder
			// structure may not include videos; this just avoids the unmigrated
			// comment and links to where a video would land if uploaded.
			const src = String(node.src ?? '').replace(
				/__GHOST_URL__\/content\/media\//,
				'/media/'
			);
			const poster = node.customThumbnailSrc
				? rewriteImg(node.customThumbnailSrc)
				: node.thumbnailSrc
					? rewriteImg(node.thumbnailSrc)
					: '';
			return `<figure class="kg-card kg-video-card"><video src="${src}" controls${poster ? ` poster="${poster}"` : ''} preload="metadata"></video></figure>`;
		}
		case 'image':
			return imageDirective(node);
		case 'bookmark':
			return bookmarkDirective(node);
		case 'gallery':
			return galleryBlock(node);
		case 'codeblock':
			return codeBlock(node);
		case 'html':
			return htmlBlock(node);
		default:
			// Inline-typed nodes occasionally appear at block position (e.g.
			// directly inside a quote). Render them as a paragraph.
			if (isInlineType(type)) return renderInline(node);
			console.warn(`  ! unknown lexical node type: ${type}`);
			return `<!-- unmigrated:${type} -->`;
	}
}

function isInlineType(t: string): boolean {
	return t === 'text' || t === 'extended-text' || t === 'linebreak' || t === 'link';
}

function lexicalToMd(lexicalJson: string): string {
	let parsed: any;
	try {
		parsed = JSON.parse(lexicalJson);
	} catch {
		return '';
	}
	const root = parsed?.root;
	if (!root || !Array.isArray(root.children)) return '';
	const blocks: string[] = [];
	for (const child of root.children) {
		const out = blockToMd(child);
		if (out !== '') blocks.push(out);
	}
	return blocks.join('\n\n');
}

function htmlFallback(html: string): string {
	if (!html) return '';
	const rewritten = rewriteImg(html);
	return turndown.turndown(rewritten);
}

function emitYaml(obj: Record<string, unknown>): string {
	// js-yaml's default block style is what we want for human readability.
	return yaml
		.dump(obj, {
			lineWidth: 0,
			noCompatMode: true,
			quotingType: '"',
			forceQuotes: false
		})
		.trim();
}

function ensureDir(d: string) {
	if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

type GhostExport = { db: [{ data: Record<string, any[]> }] };

function readingTime(text: string): number {
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 265));
}

function main() {
	if (!existsSync(SRC_JSON)) {
		if (existsSync(ARCHIVE_JSON)) {
			console.log(`Source already archived at ${ARCHIVE_JSON}.`);
			console.log(`To re-run migration, copy it back to data/ghost-export.json first.`);
			return;
		}
		console.error(`Source not found: ${SRC_JSON}`);
		process.exit(1);
	}

	const data = (JSON.parse(readFileSync(SRC_JSON, 'utf8')) as GhostExport).db[0].data;

	const tagsById = new Map<string, any>();
	for (const t of data.tags) tagsById.set(t.id, t);

	const usersById = new Map<string, any>();
	for (const u of data.users) usersById.set(u.id, u);

	const postTagsByPostId = new Map<string, { tag_id: string; sort_order: number }[]>();
	for (const pt of data.posts_tags) {
		const list = postTagsByPostId.get(pt.post_id) ?? [];
		list.push({ tag_id: pt.tag_id, sort_order: pt.sort_order });
		postTagsByPostId.set(pt.post_id, list);
	}

	const postAuthorsByPostId = new Map<string, { author_id: string; sort_order: number }[]>();
	for (const pa of data.posts_authors) {
		const list = postAuthorsByPostId.get(pa.post_id) ?? [];
		list.push({ author_id: pa.author_id, sort_order: pa.sort_order });
		postAuthorsByPostId.set(pa.post_id, list);
	}

	ensureDir(POSTS_DIR);
	ensureDir(PAGES_DIR);

	const usedTagSlugs = new Set<string>();
	const usedAuthorSlugs = new Set<string>();
	let postCount = 0;
	let pageCount = 0;
	let unknownNodeWarned = false;

	for (const p of data.posts) {
		if (p.status !== 'published') continue;
		if (RESERVED_SLUGS.has(p.slug)) {
			console.warn(`SKIP reserved slug "${p.slug}"`);
			continue;
		}

		const tagRels = (postTagsByPostId.get(p.id) ?? []).sort(
			(a, b) => a.sort_order - b.sort_order
		);
		const tagSlugs = tagRels
			.map((r) => tagsById.get(r.tag_id)?.slug)
			.filter((s): s is string => typeof s === 'string');
		for (const s of tagSlugs) usedTagSlugs.add(s);

		const authorRels = (postAuthorsByPostId.get(p.id) ?? []).sort(
			(a, b) => a.sort_order - b.sort_order
		);
		const authorSlugs = authorRels
			.map((r) => usersById.get(r.author_id)?.slug)
			.filter((s): s is string => typeof s === 'string' && s !== 'ghost');
		for (const s of authorSlugs) usedAuthorSlugs.add(s);

		// Body — lexical first, html fallback
		let body = '';
		if (p.lexical) {
			try {
				body = lexicalToMd(p.lexical);
			} catch (e) {
				console.warn(`  ! lexical→md failed for ${p.slug}: ${(e as Error).message}`);
			}
		}
		if (!body && p.html) body = htmlFallback(p.html);

		// Frontmatter
		const fm: Record<string, unknown> = {
			title: p.title,
			slug: p.slug,
			type: p.type,
			published: p.published_at,
			updated: p.updated_at,
			...(p.custom_excerpt ? { excerpt: p.custom_excerpt } : {}),
			...(p.feature_image ? { feature_image: rewriteImg(p.feature_image) } : {}),
			...(tagSlugs.length ? { tags: tagSlugs } : {}),
			...(authorSlugs.length ? { authors: authorSlugs } : {}),
			featured: !!p.featured,
			reading_time: readingTime(p.plaintext ?? ''),
			...(p.show_title_and_feature_image === false
				? { show_title_and_feature_image: false }
				: {})
		};

		const fmYaml = emitYaml(fm);
		const md = `---\n${fmYaml}\n---\n\n${body.trim()}\n`;
		const dir = p.type === 'page' ? PAGES_DIR : POSTS_DIR;
		writeFileSync(resolve(dir, `${p.slug}.md`), md);
		if (p.type === 'page') pageCount++;
		else postCount++;
	}

	// tags.yaml — in slug order, only tags that appear on at least one post
	const tagOut: Record<string, any> = {};
	for (const t of data.tags) {
		if (!usedTagSlugs.has(t.slug)) continue;
		tagOut[t.slug] = {
			name: t.name,
			...(t.description ? { description: t.description } : {}),
			...(t.feature_image ? { feature_image: rewriteImg(t.feature_image) } : {})
		};
	}
	writeFileSync(TAGS_FILE, emitYaml(tagOut) + '\n');

	const authorOut: Record<string, any> = {};
	for (const u of data.users) {
		if (!usedAuthorSlugs.has(u.slug)) continue;
		authorOut[u.slug] = {
			name: u.name,
			...(u.bio ? { bio: u.bio } : {}),
			...(u.profile_image ? { profile_image: rewriteImg(u.profile_image) } : {}),
			...(u.cover_image ? { cover_image: rewriteImg(u.cover_image) } : {}),
			...(u.website ? { website: u.website } : {}),
			...(u.twitter ? { twitter: u.twitter } : {})
		};
	}
	writeFileSync(AUTHORS_FILE, emitYaml(authorOut) + '\n');

	// Settings — keep what we currently surface to the runtime
	const settingsKv: Record<string, string> = {};
	for (const s of data.settings) settingsKv[s.key] = s.value;
	const settings = {
		title: settingsKv.title ?? 'Site',
		description: settingsKv.description ?? '',
		logo: settingsKv.logo ? rewriteImg(settingsKv.logo) : null,
		icon: settingsKv.icon ? rewriteImg(settingsKv.icon) : null,
		cover_image: settingsKv.cover_image ?? null,
		navigation: safeJson(settingsKv.navigation, []),
		secondary_navigation: safeJson(settingsKv.secondary_navigation, [])
	};
	writeFileSync(resolve(ROOT, 'content/settings.yaml'), emitYaml(settings) + '\n');

	// Archive the source JSON
	ensureDir(dirname(ARCHIVE_JSON));
	if (existsSync(SRC_JSON)) {
		renameSync(SRC_JSON, ARCHIVE_JSON);
		console.log(`\nArchived ${SRC_JSON} → ${ARCHIVE_JSON}`);
	}

	console.log(
		`\nWrote ${postCount} posts, ${pageCount} pages, ${Object.keys(tagOut).length} tags, ${Object.keys(authorOut).length} authors.`
	);
}

function safeJson<T>(v: string | undefined, fb: T): T {
	if (!v) return fb;
	try {
		return JSON.parse(v) as T;
	} catch {
		return fb;
	}
}

main();
