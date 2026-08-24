import { error } from '@sveltejs/kit';
import { posts, settings, POSTS_PER_PAGE } from '$lib/content';
import { SITE_URL } from '$lib/site';
import { listingMarkdown } from '$lib/markdown-listing';

export const prerender = true;

// Endpoint routes are not covered by the page's entries() — list them here
// so the prerenderer discovers the .md mirrors.
export function entries() {
	const featuredCount = posts.filter((p) => p.featured).slice(0, 3).length;
	const recent = posts.length - featuredCount;
	const totalPages = Math.ceil(recent / POSTS_PER_PAGE);
	return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export function GET({ params }: { params: { n: string } }) {
	const n = Number(params.n);
	if (!Number.isInteger(n) || n < 2) error(404, 'Bad page');

	const featured = posts.filter((p) => p.featured).slice(0, 3);
	const featuredIds = new Set(featured.map((p) => p.id));
	const recent = posts.filter((p) => !featuredIds.has(p.id));
	const totalPages = Math.ceil(recent.length / POSTS_PER_PAGE);
	if (n > totalPages) error(404, 'Bad page');

	const slice = recent.slice((n - 1) * POSTS_PER_PAGE, n * POSTS_PER_PAGE);
	return listingMarkdown({
		title: `Page ${n} — ${settings.title}`,
		canonical: `${SITE_URL}/page/${n}/`,
		sections: [
			{ posts: slice },
			{
				lines: [
					n > 2 ? `- [Newer posts](${SITE_URL}/page/${n - 1}/)` : `- [Newer posts](${SITE_URL}/)`,
					...(n < totalPages ? [`- [Older posts](${SITE_URL}/page/${n + 1}/)`] : [])
				]
			}
		]
	});
}
