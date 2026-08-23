/**
 * Bespoke inline SVG diagrams, referenced from markdown as `[[SVG:name]]`
 * on its own line. Each entry: { title, type: 'svg' | 'html', body }.
 *
 * - type 'svg'  → rendered as <figure class="fig fig-dgm">{body}<figcaption>…
 * - type 'html' → body wrapped in <div class="cmp-wrap"> (comparison tables etc.)
 *
 * Text uses currentColor so diagrams inherit the page ink. The gold accent
 * (C.gold) is used as a solid FILL — accent boxes paint solid gold with
 * ink stroke/text; every other color strokes itself over a ~12% alpha fill.
 *
 * Compose diagrams with the helpers below rather than hand-writing SVG:
 *   svg(viewBox, body, extraDefs?) — wraps body, auto-generates arrow markers
 *   box(x, y, w, h, accent, title, lines?) — rounded rect + centered text
 *   arrow(x1, y1, x2, y2, colorName, dash?) — line with a matching marker
 *   label(x, y, text, anchor?, opacity?) — small annotation text
 */

export type Diagram = { title: string; type: 'svg' | 'html'; body: string };

const INK = '#1a1a1a';
export const C: Record<string, string> = {
	green: '#16a34a',
	blue: '#2563eb',
	gold: '#f59e0b',
	amber: '#e0850f',
	red: '#dc2626',
	pink: '#db2777',
	gray: '#64748b'
};

const fade = (hex: string) => hex + '20'; // ~12% alpha
const isGold = (hex: string) => hex === C.gold;
const strokeFor = (hex: string) => (isGold(hex) ? INK : hex);
const fillFor = (hex: string) => (isGold(hex) ? hex : fade(hex));

export function svg(vb: string, body: string, extraDefs?: string): string {
	const markers = Object.entries(C)
		.map(
			([n, c]) =>
				`<marker id="m-${n}" markerWidth="9" markerHeight="7" refX="7.5" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="${strokeFor(c)}"/></marker>`
		)
		.join('');
	return `<svg class="dgm-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><defs>${markers}${extraDefs || ''}</defs>${body}</svg>`;
}

export function box(
	x: number,
	y: number,
	w: number,
	h: number,
	accent: string,
	title: string,
	lines?: string[]
): string {
	const t = `<text x="${x + w / 2}" y="${y + 20}" text-anchor="middle" font-size="13" font-weight="700" fill="${strokeFor(accent)}">${title}</text>`;
	const ls = (lines || [])
		.map(
			(l, i) =>
				`<text x="${x + w / 2}" y="${y + 38 + i * 15}" text-anchor="middle" font-size="10.5" fill="currentColor" opacity="0.78">${l}</text>`
		)
		.join('');
	return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${fillFor(accent)}" stroke="${strokeFor(accent)}" stroke-width="1.6"/>${t}${ls}`;
}

export function arrow(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	name: string,
	dash?: boolean
): string {
	return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeFor(C[name])}" stroke-width="1.8" marker-end="url(#m-${name})"${dash ? ' stroke-dasharray="5,4"' : ''}/>`;
}

export const label = (
	x: number,
	y: number,
	s: string,
	anchor?: string,
	op?: number
): string =>
	`<text x="${x}" y="${y}" text-anchor="${anchor || 'start'}" font-size="10.5" fill="currentColor" opacity="${op == null ? 0.7 : op}">${s}</text>`;

export const diagrams: Record<string, Diagram> = {
	demo: {
		title: 'Demo diagram — how an SVG token renders',
		type: 'svg',
		body: svg(
			'0 0 720 150',
			box(20, 40, 180, 78, C.blue, 'Markdown', ['SVG token', 'on its own line']) +
				box(270, 40, 180, 78, C.green, 'Registry', ['scripts/diagrams-svg.ts', 'name → {title, body}']) +
				box(520, 40, 180, 78, C.gold, 'Inline figure', ['SVG embedded in the', 'page, inherits ink']) +
				arrow(200, 79, 268, 79, 'blue') +
				arrow(450, 79, 518, 79, 'green') +
				label(235, 70, 'parse', 'middle', 0.6) +
				label(485, 70, 'resolve', 'middle', 0.6)
		)
	}
};
