/**
 * Markdown content negotiation for arriqaaq.com (GitHub Pages origin).
 *
 * The static build ships a markdown mirror next to every HTML page
 * (`/<path>/index.md`, including `/index.md` for the home page). GitHub
 * Pages cannot vary responses on the Accept header, so this Worker does
 * the negotiation at the edge:
 *
 *   Accept: text/markdown  ->  serve the mirror as text/markdown
 *   anything else          ->  pass through to the origin untouched
 *
 * Pages without a mirror fall back to the normal HTML response, so
 * enabling this Worker can never break a URL.
 *
 * This replicates Cloudflare's built-in "Markdown for Agents"
 * (https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/),
 * which is only available on Pro+ zones, on a free zone.
 */

const HAS_EXTENSION = /\.[a-z0-9]{1,8}$/i;

export function mirrorPathFor(pathname) {
	// Requests that already target a file (feeds, assets, the mirrors
	// themselves) are never remapped.
	if (HAS_EXTENSION.test(pathname)) return null;
	return (pathname.endsWith('/') ? pathname : pathname + '/') + 'index.md';
}

// ~4 characters per token is the conventional rough estimate.
const estimateTokens = (text) => Math.ceil(text.length / 4);

async function passThrough(request) {
	const response = await fetch(request);
	const type = response.headers.get('Content-Type') || '';
	if (!type.includes('text/html')) return response;
	// HTML pages have a markdown variant on the same URL — shared caches
	// must key on Accept.
	const headers = new Headers(response.headers);
	headers.append('Vary', 'Accept');
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

export default {
	async fetch(request) {
		if (request.method !== 'GET' && request.method !== 'HEAD') return fetch(request);

		const accept = (request.headers.get('Accept') || '').toLowerCase();
		if (!accept.includes('text/markdown')) return passThrough(request);

		const url = new URL(request.url);
		const mirrorPath = mirrorPathFor(url.pathname);
		if (!mirrorPath) return passThrough(request);

		const mirror = await fetch(new URL(mirrorPath, url.origin), {
			cf: { cacheEverything: true, cacheTtl: 300 }
		});
		if (!mirror.ok) return passThrough(request);

		const body = await mirror.text();
		const canonical = url.origin + mirrorPath.slice(0, -'index.md'.length);
		const headers = new Headers({
			'Content-Type': 'text/markdown; charset=utf-8',
			'X-Markdown-Tokens': String(estimateTokens(body)),
			Vary: 'Accept',
			Link: `<${canonical}>; rel="canonical"`
		});
		for (const name of ['Cache-Control', 'Last-Modified', 'ETag']) {
			const value = mirror.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(request.method === 'HEAD' ? null : body, { headers });
	}
};
