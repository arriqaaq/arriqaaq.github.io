import { posts, pages, settings } from '$lib/content';
import { SITE_URL } from '$lib/site';
import markdownRaw from '$lib/generated/markdown.json';

export const prerender = true;

const markdown = markdownRaw as Record<string, string>;

export function GET() {
	const header =
		`# ${settings.title} — full content\n\n` +
		`> ${settings.description.replace(/\s+/g, ' ').trim()}\n\n` +
		`Each document below carries its canonical URL in its metadata header. ` +
		`Index: ${SITE_URL}/llms.txt\n`;

	const docs = [...pages, ...posts]
		.map((p) => markdown[p.slug])
		.filter(Boolean);

	return new Response([header, ...docs].join('\n\n---\n\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
