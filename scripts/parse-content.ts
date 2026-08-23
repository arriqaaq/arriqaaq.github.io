/**
 * Reads content/posts/*.md, content/pages/*.md, content/tags.yaml,
 * content/authors.yaml, content/settings.yaml — runs each markdown body
 * through a unified pipeline (frontmatter strip, directive→hast, raw HTML
 * passthrough, stringify) — emits typed JSON into src/lib/generated/ that
 * matches the shape the existing route loaders expect.
 *
 * Replaces scripts/parse-ghost.ts.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { all as allLanguages } from 'lowlight';
import rehypeStringify from 'rehype-stringify';
import remarkGhostCards from './remark-ghost-cards.js';
import remarkEmbedTokens, { createEmbedState, type EmbedState } from './remark-embed-tokens.js';
import rehypeHeadingIds, { createHeadingState, type TocEntry } from './rehype-heading-ids.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = resolve(ROOT, 'content/posts');
const PAGES_DIR = resolve(ROOT, 'content/pages');
const REPORTS_DIR = resolve(ROOT, 'content/reports');
const TAGS_FILE = resolve(ROOT, 'content/tags.yaml');
const AUTHORS_FILE = resolve(ROOT, 'content/authors.yaml');
const SETTINGS_FILE = resolve(ROOT, 'content/settings.yaml');
const OUT_DIR = resolve(ROOT, 'src/lib/generated');

const RESERVED_SLUGS = new Set([
	'tag',
	'author',
	'page',
	'rss',
	'report',
	'sitemap.xml',
	'rss.xml',
	'llms.txt',
	'llms-full.txt'
]);

type ParsedPost = {
	id: string;
	uuid: string;
	type: 'post' | 'page';
	slug: string;
	title: string;
	html: string;
	plaintext: string;
	feature_image: string | null;
	custom_excerpt: string | null;
	published_at: string;
	updated_at: string;
	reading_time: number;
	featured: boolean;
	visibility: string;
	show_title_and_feature_image: boolean;
	custom_template: string | null;
	tags: string[];
	primary_tag: string | null;
	authors: string[];
	primary_author: string | null;
	toc: TocEntry[];
	words: number;
	diagram_count: number;
	widgets: string[];
};

function createProcessor(embedState: EmbedState, headingState: { toc: TocEntry[] }) {
	return unified()
		.use(remarkParse)
		.use(remarkDirective)
		.use(remarkGhostCards)
		.use(remarkEmbedTokens, embedState)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeHighlight, { languages: allLanguages, detect: false })
		.use(rehypeHeadingIds, headingState)
		.use(rehypeStringify, { allowDangerousHtml: true });
}

function readingTime(text: string): number {
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 265));
}

function deterministicId(slug: string): string {
	const h = createHash('sha1').update(slug).digest('hex');
	return h.slice(0, 24);
}

function deterministicUuid(slug: string): string {
	const h = createHash('sha1').update('uuid:' + slug).digest('hex');
	return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].join('-');
}

function htmlToPlaintext(html: string): string {
	return html
		.replace(/<style[^>]*>.*?<\/style>/gis, '')
		.replace(/<script[^>]*>.*?<\/script>/gis, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&[a-z#0-9]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function countWords(html: string): number {
	return html
		.replace(/<pre[\s\S]*?<\/pre>/g, ' ')
		.replace(/<svg[\s\S]*?<\/svg>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&[a-z#0-9]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean).length;
}

// Strict leftover scan — only our token shapes, so legacy bracket prose never trips it.
const LEFTOVER = /\[\[(?:SVG|WIDGET):[a-z0-9-]+\]\]/g;

type ParsedFile = {
	fm: any;
	source: string;
	html: string;
	plaintext: string;
	toc: TocEntry[];
	words: number;
	diagram_count: number;
	widgets: string[];
	embedErrors: string[];
};

async function parseFile(file: string): Promise<ParsedFile> {
	const raw = readFileSync(file, 'utf8');
	const parsed = matter(raw);
	const embedState = createEmbedState();
	const headingState = createHeadingState();
	const processor = createProcessor(embedState, headingState);
	const tree = await processor.run(processor.parse(parsed.content));
	const html = processor.stringify(tree as any).toString();
	const plaintext = htmlToPlaintext(html);
	const leftovers = html.match(LEFTOVER) ?? [];
	return {
		fm: parsed.data,
		source: parsed.content,
		html,
		plaintext,
		toc: headingState.toc,
		words: countWords(html),
		diagram_count: embedState.usedSvgs.length,
		widgets: embedState.mounts.map((m) => m.name),
		embedErrors: [...embedState.errors, ...leftovers]
	};
}

async function readMdDir(dir: string): Promise<({ slug: string } & ParsedFile)[]> {
	if (!existsSync(dir)) return [];
	const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
	const out = [];
	for (const f of files) {
		const slug = basename(f, '.md');
		if (RESERVED_SLUGS.has(slug)) {
			console.warn(`SKIP reserved slug: "${slug}"`);
			continue;
		}
		const r = await parseFile(resolve(dir, f));
		out.push({ slug, ...r });
	}
	return out;
}

function loadYaml<T = any>(file: string, fallback: T): T {
	if (!existsSync(file)) return fallback;
	return (yaml.load(readFileSync(file, 'utf8')) as T) ?? fallback;
}

function alternatingRotation(i: number): number {
	const cycle = [-3, 0, 3];
	return cycle[i % cycle.length];
}

function deriveExcerpt(plaintext: string, max = 200): string | null {
	if (!plaintext) return null;
	const trimmed = plaintext.trim();
	if (trimmed.length <= max) return trimmed;
	return trimmed.slice(0, max).replace(/\s+\S*$/, '').trim() + '…';
}

type Palette = { bg: string; theme: 'light' | 'dark' };
// All chapter palette slots are dark-themed so the cover headline reads white
// on a colored background. The intro chapter is light-themed
// separately to render the brand rose "Arriqaaq" on the soft accent wash.
const DEFAULT_PALETTE: Palette[] = [
	{ bg: 'var(--swatch--gold)', theme: 'dark' },
	{ bg: 'var(--swatch--cobalt)', theme: 'dark' },
	{ bg: 'var(--swatch--amethyst)', theme: 'dark' },
	{ bg: 'var(--swatch--dusk)', theme: 'dark' },
	{ bg: 'var(--fiqh-to)', theme: 'dark' },
	{ bg: 'var(--swatch--black)', theme: 'dark' }
];

async function main() {
	mkdirSync(OUT_DIR, { recursive: true });

	const tagsRaw = loadYaml<Record<string, any>>(TAGS_FILE, {});
	const authorsRaw = loadYaml<Record<string, any>>(AUTHORS_FILE, {});
	const settingsRaw = loadYaml<any>(SETTINGS_FILE, {});
	const siteUrl = String(settingsRaw.url ?? 'https://arriqaaq.com').replace(/\/+$/, '');

	const tags = Object.entries(tagsRaw).map(([slug, t]: [string, any]) => ({
		id: deterministicId('tag:' + slug),
		slug,
		name: t.name,
		description: t.description ?? null,
		feature_image: t.feature_image ?? null,
		post_count: 0
	}));
	const tagBySlug = new Map(tags.map((t) => [t.slug, t]));

	const authors = Object.entries(authorsRaw).map(([slug, a]: [string, any]) => ({
		id: deterministicId('author:' + slug),
		slug,
		name: a.name,
		bio: a.bio ?? null,
		profile_image: a.profile_image ?? null,
		cover_image: a.cover_image ?? null,
		website: a.website ?? null,
		twitter: a.twitter ?? null
	}));
	const authorBySlug = new Map(authors.map((a) => [a.slug, a]));

	const postFiles = await readMdDir(POSTS_DIR);
	const pageFiles = await readMdDir(PAGES_DIR);

	function buildPost(rec: { slug: string } & ParsedFile): ParsedPost {
		const fm = rec.fm;
		const tagSlugs: string[] = (fm.tags ?? []).filter((s: string) => tagBySlug.has(s));
		const authorSlugs: string[] = (fm.authors ?? []).filter((s: string) => authorBySlug.has(s));
		for (const ts of tagSlugs) tagBySlug.get(ts)!.post_count++;

		const tagIds = tagSlugs.map((s) => tagBySlug.get(s)!.id);
		const authorIds = authorSlugs.map((s) => authorBySlug.get(s)!.id);

		return {
			id: deterministicId('post:' + rec.slug),
			uuid: deterministicUuid(rec.slug),
			type: (fm.type as 'post' | 'page') ?? 'post',
			slug: rec.slug,
			title: fm.title,
			html: rec.html,
			plaintext: rec.plaintext,
			feature_image: fm.feature_image ?? null,
			custom_excerpt: fm.excerpt ?? null,
			published_at: typeof fm.published === 'string' ? fm.published : new Date(fm.published).toISOString(),
			updated_at:
				typeof fm.updated === 'string'
					? fm.updated
					: fm.updated
						? new Date(fm.updated).toISOString()
						: typeof fm.published === 'string'
							? fm.published
							: new Date(fm.published).toISOString(),
			reading_time: typeof fm.reading_time === 'number' ? fm.reading_time : readingTime(rec.plaintext),
			featured: !!fm.featured,
			visibility: fm.visibility ?? 'public',
			show_title_and_feature_image: fm.show_title_and_feature_image !== false,
			custom_template: fm.custom_template ?? null,
			tags: tagIds,
			primary_tag: tagIds[0] ?? null,
			authors: authorIds,
			primary_author: authorIds[0] ?? null,
			toc: rec.toc,
			words: rec.words,
			diagram_count: rec.diagram_count,
			widgets: rec.widgets
		};
	}

	// Fail the build loudly on unresolved/unknown [[SVG:…]]/[[WIDGET:…]] tokens.
	const embedFailures = [...postFiles, ...pageFiles]
		.filter((r) => r.embedErrors.length > 0)
		.map((r) => `  ${r.slug}: ${r.embedErrors.join(', ')}`);
	if (embedFailures.length > 0) {
		console.error('Unresolved embed tokens:\n' + embedFailures.join('\n'));
		process.exit(1);
	}

	const posts = postFiles.map(buildPost).sort((a, b) =>
		a.published_at < b.published_at ? 1 : -1
	);
	const pages = pageFiles.map(buildPost).sort((a, b) =>
		a.published_at < b.published_at ? 1 : -1
	);

	const tagsOut = tags.filter((t) => t.post_count > 0).sort((a, b) => b.post_count - a.post_count);

	const postBySlugMap = new Map(posts.map((p) => [p.slug, p]));
	const pageBySlugMap = new Map(pages.map((p) => [p.slug, p]));

	// Markdown mirrors: raw frontmatter-stripped source with a small metadata
	// header, keyed by slug. Emitted as its own JSON so only build-time
	// endpoints import it — never the client bundle.
	const markdown: Record<string, string> = {};
	for (const rec of [...postFiles, ...pageFiles]) {
		const doc = postBySlugMap.get(rec.slug) ?? pageBySlugMap.get(rec.slug);
		if (!doc) continue;
		const tagNames = ((rec.fm.tags ?? []) as string[])
			.map((s) => tagBySlug.get(s)?.name)
			.filter(Boolean);
		const authorName = rec.fm.authors?.[0]
			? (authorBySlug.get(rec.fm.authors[0])?.name ?? null)
			: null;
		const header = [
			'---',
			`title: ${JSON.stringify(doc.title)}`,
			`canonical: ${siteUrl}/${doc.slug}/`,
			`published: ${doc.published_at}`,
			`updated: ${doc.updated_at}`,
			tagNames.length ? `tags: [${tagNames.map((n) => JSON.stringify(n)).join(', ')}]` : null,
			authorName ? `author: ${JSON.stringify(authorName)}` : null,
			'---'
		].filter(Boolean);
		markdown[doc.slug] = `${header.join('\n')}\n\n# ${doc.title}\n\n${rec.source.trim()}\n`;
	}

	function readReportManifests(dir: string): { file: string; data: any }[] {
		if (!existsSync(dir)) return [];
		const out: { file: string; data: any }[] = [];
		for (const f of readdirSync(dir)) {
			if (!/\.(ya?ml)$/i.test(f)) continue;
			const file = resolve(dir, f);
			const data = yaml.load(readFileSync(file, 'utf8'));
			if (data && typeof data === 'object') out.push({ file: f, data });
		}
		return out;
	}

	type ChapterShape = {
		id: string;
		title: string;
		nav_label: string;
		nav_icon: string | null;
		nav_index: number | null;
		bg: string;
		theme: 'light' | 'dark';
		tag: string | null;
		show_in_stepper: boolean;
	};

	function buildPostCard(post: ParsedPost, chapter: ChapterShape, rotation: number) {
		return {
			kind: 'post',
			post,
			title: post.title,
			eyebrow: null,
			excerpt: post.custom_excerpt ?? deriveExcerpt(post.plaintext, 200),
			permalink: `/${post.slug}/`,
			feature_image: post.feature_image,
			bg: chapter.bg,
			theme: chapter.theme,
			share: true,
			rotation,
			hash: null
		};
	}

	function buildSyntheticCover(chapter: ChapterShape, subtitle: string | null, hash: string) {
		return {
			kind: 'cover',
			post: null,
			title: chapter.title,
			eyebrow:
				typeof chapter.nav_index === 'number' ? `Chapter ${chapter.nav_index}` : null,
			excerpt: subtitle,
			permalink: null,
			feature_image: chapter.nav_icon,
			bg: chapter.bg,
			theme: chapter.theme,
			share: false,
			rotation: 0,
			hash
		};
	}

	function paletteAt(palette: Palette[], i: number): Palette {
		return palette[i % palette.length];
	}

	function buildReport(file: string, data: any) {
		const slug: string = data.slug ?? basename(file).replace(/\.ya?ml$/i, '');
		const topN: number =
			typeof data.top_n_tags === 'number' && data.top_n_tags > 0 ? data.top_n_tags : 6;
		const maxPostsPerChapter: number =
			typeof data.max_posts_per_chapter === 'number' && data.max_posts_per_chapter > 0
				? data.max_posts_per_chapter
				: 6;
		const includeIntro = data.include_intro !== false;
		const includeOutro = data.include_outro !== false;
		const excludeTags: Set<string> = new Set(
			Array.isArray(data.exclude_tags) ? data.exclude_tags : []
		);
		const palette: Palette[] =
			Array.isArray(data.palette) && data.palette.length > 0
				? data.palette.map((p: any) => ({
						bg: typeof p?.bg === 'string' ? p.bg : 'var(--swatch--black)',
						theme: p?.theme === 'light' ? 'light' : 'dark'
					}))
				: DEFAULT_PALETTE;
		const overrides: Record<string, { title?: string; nav_label?: string }> =
			data.chapter_overrides && typeof data.chapter_overrides === 'object'
				? data.chapter_overrides
				: {};

		// Top N tags by post_count, excluding system + user-excluded.
		const candidateTags = tags
			.filter((t) => t.post_count > 0)
			.filter((t) => !t.slug.startsWith('report-'))
			.filter((t) => !excludeTags.has(t.slug))
			.sort((a, b) => b.post_count - a.post_count)
			.slice(0, topN);

		const chapters: any[] = [];

		if (includeIntro) {
			const introBg = data.intro_bg ?? 'var(--swatch--black)';
			const introTheme: 'light' | 'dark' = data.intro_theme === 'light' ? 'light' : 'dark';
			const intro: ChapterShape = {
				id: 'intro',
				title: data.title ?? 'Intro',
				nav_label: 'Intro',
				nav_icon: null,
				nav_index: null,
				bg: introBg,
				theme: introTheme,
				tag: null,
				show_in_stepper: true
			};
			chapters.push({
				...intro,
				cards: [buildSyntheticCover(intro, data.subtitle ?? null, 'intro')]
			});
		}

		candidateTags.forEach((tag, i) => {
			const palettePick = paletteAt(palette, i);
			const ov = overrides[tag.slug] ?? {};
			const chapter: ChapterShape = {
				id: tag.slug,
				title: ov.title ?? tag.name,
				nav_label: ov.nav_label ?? tag.name,
				nav_icon: tag.feature_image ?? null,
				nav_index: i + 1,
				bg: palettePick.bg,
				theme: palettePick.theme,
				tag: tag.slug,
				show_in_stepper: true
			};
			const matched = posts
				.filter((p) => p.tags.includes(tag.id))
				.sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
				.slice(0, maxPostsPerChapter);
			const cards: any[] = [
				buildSyntheticCover(chapter, `${matched.length} post${matched.length === 1 ? '' : 's'}`, chapter.id)
			];
			matched.forEach((p, idx) => {
				cards.push(buildPostCard(p, chapter, alternatingRotation(idx + 1)));
			});
			chapters.push({ ...chapter, cards });
		});

		if (includeOutro) {
			const outroBg = data.outro_bg ?? 'var(--swatch--white)';
			const outroTheme: 'light' | 'dark' = data.outro_theme === 'dark' ? 'dark' : 'light';
			const outro: ChapterShape = {
				id: 'your-turn',
				title: 'Your Turn',
				nav_label: 'Your Turn',
				nav_icon: null,
				nav_index: null,
				bg: outroBg,
				theme: outroTheme,
				tag: null,
				show_in_stepper: true
			};
			chapters.push({
				...outro,
				cards: [
					buildSyntheticCover(
						outro,
						data.outro_subtitle ?? 'Browse more from the library',
						'your-turn'
					)
				]
			});
		}

		if (chapters.length === 0) {
			console.warn(`SKIP report "${slug}": no chapters resolved.`);
			return null;
		}

		return {
			slug,
			title: data.title ?? slug,
			subtitle: data.subtitle ?? null,
			published:
				typeof data.published === 'string'
					? data.published
					: data.published
						? new Date(data.published).toISOString()
						: new Date().toISOString(),
			cover_image: data.cover_image ?? null,
			press_kit_url: data.press_kit_url ?? null,
			chapters
		};
	}

	const reportManifests = readReportManifests(REPORTS_DIR);
	const reports = reportManifests
		.map(({ file, data }) => buildReport(file, data))
		.filter(Boolean);

	const settings = {
		title: settingsRaw.title ?? 'Site',
		url: siteUrl,
		description: settingsRaw.description ?? '',
		logo: settingsRaw.logo ?? null,
		icon: settingsRaw.icon ?? null,
		cover_image: settingsRaw.cover_image ?? null,
		navigation: settingsRaw.navigation ?? [],
		secondary_navigation: settingsRaw.secondary_navigation ?? []
	};

	writeFileSync(resolve(OUT_DIR, 'posts.json'), JSON.stringify(posts, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'tags.json'), JSON.stringify(tagsOut, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'authors.json'), JSON.stringify(authors, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'settings.json'), JSON.stringify(settings, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'reports.json'), JSON.stringify(reports, null, '\t'));
	writeFileSync(resolve(OUT_DIR, 'markdown.json'), JSON.stringify(markdown, null, '\t'));

	console.log(
		`Parsed: ${posts.length} posts, ${pages.length} pages, ${tagsOut.length} tags, ${authors.length} authors, ${reports.length} reports`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
