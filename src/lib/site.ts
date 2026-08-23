import { settings } from '$lib/content';

// Canonical origin, no trailing slash. Never use page.url.origin for
// canonical URLs — during prerender it is http://sveltekit-prerender.
export const SITE_URL = settings.url;

export const absUrl = (path: string) => SITE_URL + path;

// Page URLs always end with '/' (trailingSlash: 'always') — avoids GH Pages 301s.
export const postUrl = (slug: string) => `${SITE_URL}/${slug}/`;
