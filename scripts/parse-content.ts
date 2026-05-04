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
import rehypeStringify from 'rehype-stringify';
import remarkGhostCards from './remark-ghost-cards.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = resolve(ROOT, 'content/posts');
const PAGES_DIR = resolve(ROOT, 'content/pages');
const REPORTS_DIR = resolve(ROOT, 'content/reports');
const TAGS_FILE = resolve(ROOT, 'content/tags.yaml');
const AUTHORS_FILE = resolve(ROOT, 'content/authors.yaml');
const SETTINGS_FILE = resolve(ROOT, 'content/settings.yaml');
const OUT_DIR = resolve(ROOT, 'src/lib/generated');

const RESERVED_SLUGS = new Set(['tag', 'author', 'page', 'rss', 'report']);

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
};

const processor = unified()
	.use(remarkParse)
	.use(remarkDirective)
	.use(remarkGhostCards)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw)
	.use(rehypeStringify, { allowDangerousHtml: true });

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

async function parseFile(file: string): Promise<{ fm: any; html: string; plaintext: string }> {
	const raw = readFileSync(file, 'utf8');
	const parsed = matter(raw);
	const tree = await processor.run(processor.parse(parsed.content));
	const html = processor.stringify(tree as any).toString();
	const plaintext = htmlToPlaintext(html);
	return { fm: parsed.data, html, plaintext };
}

async function readMdDir(dir: string): Promise<{ slug: string; fm: any; html: string; plaintext: string }[]> {
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

type RawCardMeta = {
	kind?: string;
	bg?: string;
	theme?: 'light' | 'dark';
	share?: boolean;
	order?: number;
	bullet?: { value: number | string; unit?: string };
	rotation?: number;
};

const REPORT_CARD_KINDS = new Set([
	'cover',
	'stat',
	'quote',
	'chart',
	'callout',
	'stat-chart'
]);

function alternatingRotation(i: number): number {
	const cycle = [-3, 0, 3];
	return cycle[i % cycle.length];
}

async function main() {
	mkdirSync(OUT_DIR, { recursive: true });

	const tagsRaw = loadYaml<Record<string, any>>(TAGS_FILE, {});
	const authorsRaw = loadYaml<Record<string, any>>(AUTHORS_FILE, {});
	const settingsRaw = loadYaml<any>(SETTINGS_FILE, {});

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

	const postReportMeta = new Map<string, RawCardMeta>();

	function buildPost(rec: { slug: string; fm: any; html: string; plaintext: string }): ParsedPost {
		const fm = rec.fm;
		const tagSlugs: string[] = (fm.tags ?? []).filter((s: string) => tagBySlug.has(s));
		const authorSlugs: string[] = (fm.authors ?? []).filter((s: string) => authorBySlug.has(s));
		for (const ts of tagSlugs) tagBySlug.get(ts)!.post_count++;

		const tagIds = tagSlugs.map((s) => tagBySlug.get(s)!.id);
		const authorIds = authorSlugs.map((s) => authorBySlug.get(s)!.id);

		if (fm.report && typeof fm.report === 'object') {
			postReportMeta.set(rec.slug, fm.report as RawCardMeta);
		}

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
			primary_author: authorIds[0] ?? null
		};
	}

	const posts = postFiles.map(buildPost).sort((a, b) =>
		a.published_at < b.published_at ? 1 : -1
	);
	const pages = pageFiles.map(buildPost).sort((a, b) =>
		a.published_at < b.published_at ? 1 : -1
	);

	const tagsOut = tags.filter((t) => t.post_count > 0).sort((a, b) => b.post_count - a.post_count);

	const postBySlugMap = new Map(posts.map((p) => [p.slug, p]));

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

	function buildReportCardFromPost(
		post: ParsedPost,
		chapter: any,
		hash: string | null,
		fallbackRotation: number
	) {
		const meta = postReportMeta.get(post.slug) ?? {};
		const rawKind = meta.kind ?? 'callout';
		const kind = REPORT_CARD_KINDS.has(rawKind) ? rawKind : 'callout';
		const theme: 'light' | 'dark' =
			meta.theme === 'light' || meta.theme === 'dark' ? meta.theme : chapter.theme;
		return {
			kind,
			post,
			title: post.title,
			eyebrow: null,
			body_html: post.html,
			feature_image: post.feature_image,
			bg: meta.bg ?? chapter.bg,
			theme,
			share: meta.share !== false,
			rotation:
				typeof meta.rotation === 'number' ? meta.rotation : fallbackRotation,
			bullet: meta.bullet
				? {
						value: meta.bullet.value,
						unit: meta.bullet.unit ?? null
					}
				: null,
			hash
		};
	}

	function buildSyntheticCover(chapter: any, hash: string) {
		return {
			kind: 'cover',
			post: null,
			title: chapter.title ?? chapter.nav_label ?? null,
			eyebrow:
				typeof chapter.nav_index === 'number' ? `Chapter ${chapter.nav_index}` : null,
			body_html: chapter.subtitle ?? null,
			feature_image: chapter.cover_image ?? chapter.nav_icon ?? null,
			bg: chapter.bg,
			theme: chapter.theme,
			share: false,
			rotation: 0,
			bullet: null,
			hash
		};
	}

	function buildReport(file: string, data: any) {
		const slug: string = data.slug ?? basename(file).replace(/\.ya?ml$/i, '');
		if (!Array.isArray(data.chapters)) {
			console.warn(`SKIP report "${slug}": no chapters[] array.`);
			return null;
		}
		const chapters = data.chapters
			.map((ch: any) => {
				if (!ch || typeof ch !== 'object' || !ch.id) {
					console.warn(`  report "${slug}": skipping chapter without id.`);
					return null;
				}
				const theme: 'light' | 'dark' = ch.theme === 'dark' ? 'dark' : 'light';
				const bg: string =
					typeof ch.bg === 'string' && ch.bg.trim()
						? ch.bg
						: 'var(--swatch--black)';
				const chapter = {
					id: String(ch.id),
					title: ch.title ?? ch.nav_label ?? String(ch.id),
					nav_label: ch.nav_label ?? ch.title ?? String(ch.id),
					nav_icon: ch.nav_icon ?? null,
					nav_index: typeof ch.nav_index === 'number' ? ch.nav_index : null,
					bg,
					theme,
					tag: typeof ch.tag === 'string' ? ch.tag : null,
					show_in_stepper: ch.show_in_stepper !== false,
					subtitle: ch.subtitle ?? null,
					cover_image: ch.cover_image ?? null
				};

				const matched: ParsedPost[] = [];
				if (chapter.tag) {
					const tagRec = tagBySlug.get(chapter.tag);
					if (!tagRec) {
						console.warn(
							`  report "${slug}" / chapter "${chapter.id}": unknown tag "${chapter.tag}".`
						);
					} else {
						const tagId = tagRec.id;
						for (const p of posts) if (p.tags.includes(tagId)) matched.push(p);
					}
				}

				const coverPostSlug: string | null =
					typeof ch.cover_post === 'string' ? ch.cover_post : null;
				let coverPost: ParsedPost | null = null;
				if (coverPostSlug) {
					coverPost = postBySlugMap.get(coverPostSlug) ?? null;
					if (!coverPost) {
						console.warn(
							`  report "${slug}" / chapter "${chapter.id}": unknown cover_post "${coverPostSlug}".`
						);
					}
				}

				const ordered = matched
					.filter((p) => p.slug !== coverPostSlug)
					.sort((a, b) => {
						const oa = postReportMeta.get(a.slug)?.order ?? Number.MAX_SAFE_INTEGER;
						const ob = postReportMeta.get(b.slug)?.order ?? Number.MAX_SAFE_INTEGER;
						if (oa !== ob) return oa - ob;
						return a.published_at < b.published_at ? 1 : -1;
					});

				const cards: any[] = [];
				if (coverPost) {
					cards.push(
						buildReportCardFromPost(coverPost, chapter, chapter.id, 0)
					);
				} else {
					cards.push(buildSyntheticCover(chapter, chapter.id));
				}
				ordered.forEach((p, i) => {
					cards.push(
						buildReportCardFromPost(p, chapter, null, alternatingRotation(i + 1))
					);
				});

				if (cards.length === 1 && !coverPost && matched.length === 0) {
					console.warn(
						`  report "${slug}" / chapter "${chapter.id}": no posts resolved (synthetic cover only).`
					);
				}

				const { subtitle: _s, cover_image: _c, ...chapterOut } = chapter;
				return { ...chapterOut, cards };
			})
			.filter(Boolean);

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

	console.log(
		`Parsed: ${posts.length} posts, ${pages.length} pages, ${tagsOut.length} tags, ${authors.length} authors, ${reports.length} reports`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
