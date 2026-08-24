import { postUrl } from '$lib/site';
import type { Post } from '$lib/types';

// One-line excerpt, same shape llms.txt uses.
const excerpt = (p: Post) =>
	(p.custom_excerpt ?? p.plaintext.slice(0, 160)).replace(/\s+/g, ' ').trim();

const postLine = (p: Post) =>
	`- [${p.title}](${postUrl(p.slug)}) — ${p.published_at.slice(0, 10)}: ${excerpt(p)} ([markdown](${postUrl(p.slug)}index.md))`;

type Section = { heading?: string; lines?: string[]; posts?: Post[] };

// Markdown mirror for a listing page (home, tag, author, pagination).
// Post/page bodies get their mirrors from parse-content.ts; listing pages
// have no markdown source, so their mirrors are rendered from metadata here.
export function listingMarkdown(opts: {
	title: string;
	canonical: string;
	description?: string | null;
	sections: Section[];
}): Response {
	const lines: string[] = [
		'---',
		`title: ${JSON.stringify(opts.title)}`,
		`canonical: ${opts.canonical}`,
		'---',
		'',
		`# ${opts.title}`,
		''
	];
	if (opts.description) {
		lines.push(`> ${opts.description.replace(/\s+/g, ' ').trim()}`, '');
	}
	for (const s of opts.sections) {
		if (s.heading) lines.push(`## ${s.heading}`, '');
		if (s.lines?.length) lines.push(...s.lines, '');
		if (s.posts?.length) lines.push(...s.posts.map(postLine), '');
	}
	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
}
