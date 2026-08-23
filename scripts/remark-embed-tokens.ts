/**
 * remark plugin: resolves `[[SVG:name]]` / `[[WIDGET:name]]` tokens sitting on
 * their own line (i.e. a paragraph whose sole content is the token) into
 * `html` mdast nodes — same idiom as remark-ghost-cards. `rehype-raw` later
 * re-parses the emitted HTML into hast.
 *
 * Unknown names render a loud `.missing` box AND record an error on the shared
 * state; parse-content fails the build when any error was recorded.
 */
import { visit } from 'unist-util-visit';
import { toString as nodeToString } from 'mdast-util-to-string';
import { diagrams } from './diagrams-svg.js';
import { widgets } from './widgets.js';

export type EmbedState = {
	usedSvgs: string[];
	mounts: { name: string; id: string }[];
	errors: string[];
};

export function createEmbedState(): EmbedState {
	return { usedSvgs: [], mounts: [], errors: [] };
}

const TOKEN = /^\[\[(SVG|WIDGET):([a-z0-9-]+)\]\]$/;

function svgFig(name: string, state: EmbedState): string {
	const d = diagrams[name];
	if (!d) {
		state.errors.push(`[[SVG:${name}]]`);
		return `<div class="missing">[diagram: ${name}]</div>`;
	}
	state.usedSvgs.push(name);
	const body = d.type === 'html' ? `<div class="cmp-wrap">${d.body}</div>` : d.body;
	const cls = d.type === 'html' ? 'fig fig-cmp' : 'fig fig-dgm';
	return `<figure class="${cls}">${body}<figcaption>${d.title}</figcaption></figure>`;
}

function widgetMount(name: string, state: EmbedState): string {
	const w = widgets[name];
	if (!w) {
		state.errors.push(`[[WIDGET:${name}]]`);
		return `<div class="missing">[widget: ${name}]</div>`;
	}
	const id = `w-${name}-${state.mounts.filter((m) => m.name === name).length + 1}`;
	state.mounts.push({ name, id });
	return `<figure class="fig fig-widget"><div class="widget-mount" data-widget="${name}" id="${id}"></div><figcaption>Interactive — ${w.t}</figcaption></figure>`;
}

export default function remarkEmbedTokens(state: EmbedState) {
	return (tree: any) => {
		visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
			if (!parent || index == null) return;
			const m = nodeToString(node).trim().match(TOKEN);
			if (!m) return;
			const html = m[1] === 'SVG' ? svgFig(m[2], state) : widgetMount(m[2], state);
			parent.children[index] = { type: 'html', value: html };
		});
	};
}
