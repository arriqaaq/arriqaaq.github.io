import { error } from '@sveltejs/kit';
import { getTag, postsByTag, tags, settings } from '$lib/content';
import { SITE_URL } from '$lib/site';
import { listingMarkdown } from '$lib/markdown-listing';

export const prerender = true;

// Endpoint routes are not covered by the page's entries() — list them here
// so the prerenderer discovers the .md mirrors.
export function entries() {
	return tags.map((t) => ({ slug: t.slug }));
}

export function GET({ params }: { params: { slug: string } }) {
	const tag = getTag(params.slug);
	if (!tag) error(404, 'Tag not found');
	return listingMarkdown({
		title: `${tag.name} — ${settings.title}`,
		canonical: `${SITE_URL}/tag/${tag.slug}/`,
		description: tag.description,
		sections: [{ posts: postsByTag(tag.id) }]
	});
}
