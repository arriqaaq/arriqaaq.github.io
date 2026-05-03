import { error } from '@sveltejs/kit';
import { getAuthor, postsByAuthor, authors } from '$lib/content';

export const prerender = true;

export function entries() {
	return authors.map((a) => ({ slug: a.slug }));
}

export function load({ params }) {
	const author = getAuthor(params.slug);
	if (!author) throw error(404, 'Author not found');
	const list = postsByAuthor(author.id);
	return {
		author,
		posts: list,
		breadcrumb: `Author · ${author.name}`
	};
}
