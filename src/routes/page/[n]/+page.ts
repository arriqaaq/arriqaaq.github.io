import { error } from '@sveltejs/kit';
import { posts, POSTS_PER_PAGE } from '$lib/content';

export const prerender = true;

export function entries() {
	const featuredCount = posts.filter((p) => p.featured).slice(0, 3).length;
	const recent = posts.length - featuredCount;
	const totalPages = Math.ceil(recent / POSTS_PER_PAGE);
	return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export function load({ params }) {
	const n = Number(params.n);
	if (!Number.isInteger(n) || n < 2) throw error(404, 'Bad page');

	const featured = posts.filter((p) => p.featured).slice(0, 3);
	const featuredIds = new Set(featured.map((p) => p.id));
	const recent = posts.filter((p) => !featuredIds.has(p.id));
	const totalPages = Math.ceil(recent.length / POSTS_PER_PAGE);
	if (n > totalPages) throw error(404, 'Bad page');

	const start = (n - 1) * POSTS_PER_PAGE;
	const slice = recent.slice(start, start + POSTS_PER_PAGE);

	return {
		page: n,
		totalPages,
		posts: slice,
		breadcrumb: `Page ${n}`
	};
}
