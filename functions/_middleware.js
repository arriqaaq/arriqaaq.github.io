/**
 * Cloudflare Pages middleware (agent readiness):
 *
 * 1. Markdown content negotiation — a GET for a page URL with
 *    `Accept: text/markdown` is answered with the prebuilt markdown mirror
 *    (`/<path>/index.md`, generated at build time; the homepage and listing
 *    pages have mirrors too). Browsers never send that Accept value, so
 *    human traffic is untouched.
 * 2. Link response headers (RFC 8288) on every page response, pointing
 *    agents at the machine-readable entry points.
 *
 * Static assets (paths with a file extension, plus everything excluded in
 * static/_routes.json) pass through unchanged.
 */

const LINK_HEADER = [
	'</llms.txt>; rel="describedby"; type="text/markdown"',
	'</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
	'</sitemap.xml>; rel="sitemap"',
	'</rss.xml>; rel="alternate"; type="application/rss+xml"'
].join(', ');

export async function onRequest({ request, next, env }) {
	const url = new URL(request.url);
	const lastSegment = url.pathname.split('/').pop();
	// Page URLs end in '/' (trailingSlash: 'always'); anything with a file
	// extension is an asset.
	const isPage = !lastSegment || !lastSegment.includes('.');

	const accept = request.headers.get('accept') ?? '';
	if (request.method === 'GET' && isPage && accept.includes('text/markdown')) {
		const target = url.pathname.replace(/\/+$/, '') + '/index.md';
		const asset = await env.ASSETS.fetch(new URL(target, url));
		if (asset.ok) {
			const body = await asset.text();
			const headers = new Headers(asset.headers);
			headers.set('Content-Type', 'text/markdown; charset=utf-8');
			// Rough estimate at ~4 characters per token.
			headers.set('X-Markdown-Tokens', String(Math.ceil(body.length / 4)));
			headers.set('Vary', 'Accept');
			headers.set('Link', LINK_HEADER);
			return new Response(body, { status: 200, headers });
		}
	}

	const res = await next();
	if (!isPage) return res;

	const headers = new Headers(res.headers);
	headers.set('Link', LINK_HEADER);
	headers.set('Vary', 'Accept');
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
