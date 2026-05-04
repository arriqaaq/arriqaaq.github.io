// Maps a tag slug to one of the two site themes: 'fiqh' (maroon, brand)
// or 'tajweed' (gold, highlight). Apply via class={themeClass(slug)} on a
// component root — every descendant rule that uses var(--accent*) reskins
// automatically because each theme class redefines those CSS custom properties.

const explicit: Record<string, 'fiqh' | 'tajweed'> = {
	fiqh: 'fiqh',
	tajweed: 'tajweed',
	islam: 'fiqh',
	book: 'fiqh',
	poem: 'tajweed',
	podcast: 'tajweed',
	events: 'tajweed',
	lifestyle: 'tajweed',
	coding: 'fiqh',
	competition: 'tajweed',
	covid19: 'fiqh',
	grammar: 'tajweed',
	aqeedah: 'fiqh',
	hadith: 'fiqh',
	tafsir: 'tajweed'
};

export function themeForTag(slug: string | undefined | null): 'fiqh' | 'tajweed' {
	if (!slug) return 'fiqh';
	if (explicit[slug]) return explicit[slug];
	let h = 0;
	for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
	return Math.abs(h) % 2 === 0 ? 'fiqh' : 'tajweed';
}

export const themeClass = (slug?: string | null): string => `theme--${themeForTag(slug)}`;
