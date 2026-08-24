import { error } from '@sveltejs/kit';
import { getAuthor, postsByAuthor, authors, settings } from '$lib/content';
import { SITE_URL } from '$lib/site';
import { listingMarkdown } from '$lib/markdown-listing';

export const prerender = true;

// Endpoint routes are not covered by the page's entries() — list them here
// so the prerenderer discovers the .md mirrors.
export function entries() {
	return authors.map((a) => ({ slug: a.slug }));
}

export function GET({ params }: { params: { slug: string } }) {
	const author = getAuthor(params.slug);
	if (!author) error(404, 'Author not found');
	return listingMarkdown({
		title: `${author.name} — ${settings.title}`,
		canonical: `${SITE_URL}/author/${author.slug}/`,
		description: author.bio,
		sections: [{ posts: postsByAuthor(author.id) }]
	});
}
