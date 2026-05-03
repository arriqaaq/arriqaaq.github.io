import { posts, tags, POSTS_PER_PAGE } from '$lib/content';

export const prerender = true;

export function load() {
	const featured = posts.filter((p) => p.featured).slice(0, 3);
	const featuredIds = new Set(featured.map((p) => p.id));
	const recent = posts.filter((p) => !featuredIds.has(p.id)).slice(0, POSTS_PER_PAGE);
	const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

	return {
		hero: posts[0] ?? null,
		featured,
		recent,
		tags,
		page: 1,
		totalPages,
		breadcrumb: ''
	};
}
