import { error } from '@sveltejs/kit';
import { posts, pages } from '$lib/content';
import markdownRaw from '$lib/generated/markdown.json';

export const prerender = true;

const markdown = markdownRaw as Record<string, string>;

// Endpoint routes are not covered by the [slug] page's entries() —
// without this the prerenderer never discovers the .md mirrors.
export function entries() {
	return [...posts, ...pages].map((p) => ({ slug: p.slug }));
}

export function GET({ params }: { params: { slug: string } }) {
	const md = markdown[params.slug];
	if (!md) error(404, 'Not found');
	return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
