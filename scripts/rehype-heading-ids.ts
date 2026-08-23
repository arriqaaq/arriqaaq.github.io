/**
 * rehype plugin: gives every h1–h6 an id.
 *   `## Heading {#custom-id}` → <h2 id="custom-id">Heading</h2>
 *   otherwise the id is auto-slugified from the text, deduped per file.
 * Harvests {id, text} from each h2 into the shared state as the post's TOC.
 * Runs after rehype-raw so headings pasted as raw HTML get ids too.
 */
import { visit } from 'unist-util-visit';

export type TocEntry = { id: string; text: string };

export type HeadingState = { toc: TocEntry[] };

export function createHeadingState(): HeadingState {
	return { toc: [] };
}

const HEADING = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CUSTOM_ID = /\s*\{#([A-Za-z0-9_-]+)\}\s*$/;

function slugify(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/&[a-z#0-9]+;/g, ' ')
			.replace(/[^a-z0-9؀-ۿ]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'section'
	);
}

function textOf(node: any): string {
	if (node.type === 'text') return node.value;
	if (!Array.isArray(node.children)) return '';
	return node.children.map(textOf).join('');
}

function lastTextNode(node: any): any | null {
	if (!Array.isArray(node.children)) return null;
	for (let i = node.children.length - 1; i >= 0; i--) {
		const child = node.children[i];
		if (child.type === 'text') return child;
		const nested = lastTextNode(child);
		if (nested) return nested;
	}
	return null;
}

export default function rehypeHeadingIds(state: HeadingState) {
	return (tree: any) => {
		const seen = new Set<string>();
		visit(tree, 'element', (node: any) => {
			if (!HEADING.has(node.tagName)) return;
			let id: string | null = null;

			const last = lastTextNode(node);
			const m = last?.value ? String(last.value).match(CUSTOM_ID) : null;
			if (m) {
				id = m[1];
				last.value = last.value.slice(0, m.index).replace(/\s+$/, '');
			} else {
				id = slugify(textOf(node).trim());
			}

			let unique = id;
			for (let n = 2; seen.has(unique); n++) unique = `${id}-${n}`;
			seen.add(unique);

			node.properties = { ...(node.properties ?? {}), id: unique };
			if (node.tagName === 'h2') {
				state.toc.push({ id: unique, text: textOf(node).trim() });
			}
		});
	};
}
