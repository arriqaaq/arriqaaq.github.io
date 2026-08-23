import { posts, pages, tags, authors, POSTS_PER_PAGE } from '$lib/content';
import { SITE_URL } from '$lib/site';

export const prerender = true;

const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function latest(list: { updated_at: string }[]): string | null {
	return list.reduce<string | null>((m, p) => (m && m > p.updated_at ? m : p.updated_at), null);
}

export function GET() {
	const urls: { loc: string; lastmod?: string | null }[] = [
		{ loc: `${SITE_URL}/`, lastmod: latest(posts) }
	];

	// Pagination — mirror src/routes/page/[n]/+page.ts exactly.
	const featuredCount = posts.filter((p) => p.featured).slice(0, 3).length;
	const totalPages = Math.ceil((posts.length - featuredCount) / POSTS_PER_PAGE);
	for (let n = 2; n <= totalPages; n++) urls.push({ loc: `${SITE_URL}/page/${n}/` });

	for (const p of [...posts, ...pages]) {
		urls.push({ loc: `${SITE_URL}/${p.slug}/`, lastmod: p.updated_at });
	}
	for (const t of tags) {
		const tagged = posts.filter((p) => p.tags.includes(t.id));
		urls.push({ loc: `${SITE_URL}/tag/${t.slug}/`, lastmod: latest(tagged) });
	}
	for (const a of authors) {
		const authored = posts.filter((p) => p.authors.includes(a.id));
		urls.push({ loc: `${SITE_URL}/author/${a.slug}/`, lastmod: latest(authored) });
	}

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urls
			.map(
				(u) =>
					`<url><loc>${esc(u.loc)}</loc>${
						u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''
					}</url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
