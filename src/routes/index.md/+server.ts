import { posts, pages, tags, settings, POSTS_PER_PAGE } from '$lib/content';
import { SITE_URL, postUrl } from '$lib/site';
import { listingMarkdown } from '$lib/markdown-listing';

export const prerender = true;

export function GET() {
	const featured = posts.filter((p) => p.featured).slice(0, 3);
	const featuredIds = new Set(featured.map((p) => p.id));
	const recent = posts.filter((p) => !featuredIds.has(p.id)).slice(0, POSTS_PER_PAGE);
	const totalPages = Math.ceil((posts.length - featured.length) / POSTS_PER_PAGE);

	return listingMarkdown({
		title: settings.title,
		canonical: `${SITE_URL}/`,
		description: settings.description,
		sections: [
			{
				heading: 'Browse by discipline',
				lines: tags.map(
					(t) => `- [${t.name}](${SITE_URL}/tag/${t.slug}/) (${t.post_count} posts)`
				)
			},
			{ heading: 'Featured', posts: featured },
			{ heading: 'Latest', posts: recent },
			{
				heading: 'More',
				lines: [
					...(totalPages > 1 ? [`- [Older posts](${SITE_URL}/page/2/)`] : []),
					...pages.map((p) => `- [${p.title}](${postUrl(p.slug)})`),
					`- [All posts and pages (llms.txt)](${SITE_URL}/llms.txt)`,
					`- [Full corpus in one file (llms-full.txt)](${SITE_URL}/llms-full.txt)`,
					`- [sitemap.xml](${SITE_URL}/sitemap.xml) · [rss.xml](${SITE_URL}/rss.xml)`
				]
			}
		]
	});
}
