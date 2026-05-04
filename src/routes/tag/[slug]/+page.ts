import { error } from '@sveltejs/kit';
import { getTag, postsByTag, reportsByTag, tags } from '$lib/content';

export const prerender = true;

export function entries() {
	return tags.map((t) => ({ slug: t.slug }));
}

export function load({ params }) {
	const tag = getTag(params.slug);
	if (!tag) throw error(404, 'Tag not found');
	const list = postsByTag(tag.id);
	const featuredInReports = reportsByTag(tag.id);
	return {
		tag,
		posts: list,
		featuredInReports,
		breadcrumb: `Tag · ${tag.name}`
	};
}
