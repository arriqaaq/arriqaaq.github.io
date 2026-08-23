import { posts, pages, settings } from '$lib/content';
import { SITE_URL, postUrl } from '$lib/site';

export const prerender = true;

const excerpt = (p: { custom_excerpt: string | null; plaintext: string }) =>
	(p.custom_excerpt ?? p.plaintext.slice(0, 160)).replace(/\s+/g, ' ').trim();

export function GET() {
	const lines: string[] = [
		`# ${settings.title}`,
		'',
		`> ${settings.description.replace(/\s+/g, ' ').trim()}`,
		'',
		'## For agents',
		'',
		`- Every post and page has a markdown mirror at \`${SITE_URL}/<slug>/index.md\`.`,
		`- Full corpus in one file: [llms-full.txt](${SITE_URL}/llms-full.txt)`,
		`- URL inventory: [sitemap.xml](${SITE_URL}/sitemap.xml)`,
		`- Feed: [rss.xml](${SITE_URL}/rss.xml)`,
		'',
		'## Pages',
		''
	];
	for (const p of pages) {
		lines.push(`- [${p.title}](${postUrl(p.slug)}): ${excerpt(p)}`);
	}
	lines.push('', '## Posts', '');
	for (const p of posts) {
		lines.push(`- [${p.title}](${postUrl(p.slug)}): ${excerpt(p)}`);
	}
	lines.push('');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
