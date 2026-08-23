import { posts, settings } from '$lib/content';
import { SITE_URL, postUrl } from '$lib/site';

export const prerender = true;

const FEED_SIZE = 20;

const esc = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

// A literal ]]> inside CDATA would close it early.
const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

export function GET() {
	const items = posts.slice(0, FEED_SIZE).map((p) => {
		const url = postUrl(p.slug);
		const description = p.custom_excerpt ?? p.plaintext.slice(0, 300);
		return (
			`<item>` +
			`<title>${esc(p.title)}</title>` +
			`<link>${esc(url)}</link>` +
			`<guid isPermaLink="true">${esc(url)}</guid>` +
			`<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>` +
			`<description>${esc(description)}</description>` +
			`<content:encoded>${cdata(p.html)}</content:encoded>` +
			`</item>`
		);
	});

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n` +
		`<channel>\n` +
		`<title>${esc(settings.title)}</title>\n` +
		`<link>${SITE_URL}/</link>\n` +
		`<description>${esc(settings.description)}</description>\n` +
		`<language>en</language>\n` +
		`<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
		items.join('\n') +
		`\n</channel>\n</rss>\n`;

	return new Response(body, { headers: { 'Content-Type': 'application/rss+xml' } });
}
