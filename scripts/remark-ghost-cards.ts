/**
 * remark plugin: rewrites custom directives (`:::name{}`, `::name{}`) into
 * `html` mdast nodes whose value is the kg-* HTML Ghost emits — `rehype-raw`
 * later parses these back into hast and the existing screen.css renders them.
 *
 * Supported:
 *   ::image{src=… alt=… width=regular|wide|full caption=… href=…}
 *   ::bookmark{url=… title=… description=… author=… publisher=… icon=… thumbnail=…}
 *   :::gallery
 *     - /images/a.png
 *     - /images/b.png
 *   :::
 *   ::embed{provider=youtube url=…}
 *   :::callout{emoji=…}
 *     body
 *   :::
 *   :::toggle{title=…}
 *     body
 *   :::
 */
import { visit } from 'unist-util-visit';
import { toString as nodeToString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

type Mdast = any;

function esc(v: string | undefined): string {
	if (!v) return '';
	return String(v)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function widthClass(width?: string): string {
	if (width === 'wide') return ' kg-width-wide';
	if (width === 'full') return ' kg-width-full';
	return '';
}

function imageHtml(a: Record<string, string | undefined>): string {
	const figClass = ('kg-card kg-image-card' + widthClass(a.width)).trim();
	const img = `<img class="kg-image" src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy">`;
	const inner = a.href ? `<a href="${esc(a.href)}">${img}</a>` : img;
	const caption = a.caption ? `<figcaption>${esc(a.caption)}</figcaption>` : '';
	return `<figure class="${figClass}">${inner}${caption}</figure>`;
}

function bookmarkHtml(a: Record<string, string | undefined>): string {
	const meta: string[] = [];
	if (a.icon) meta.push(`<img class="kg-bookmark-icon" src="${esc(a.icon)}" alt="">`);
	if (a.author) meta.push(`<span class="kg-bookmark-author">${esc(a.author)}</span>`);
	if (a.publisher) meta.push(`<span class="kg-bookmark-publisher">${esc(a.publisher)}</span>`);

	const content = `<div class="kg-bookmark-content">${a.title ? `<div class="kg-bookmark-title">${esc(a.title)}</div>` : ''}${a.description ? `<div class="kg-bookmark-description">${esc(a.description)}</div>` : ''}<div class="kg-bookmark-metadata">${meta.join('')}</div></div>`;

	const thumb = a.thumbnail
		? `<div class="kg-bookmark-thumbnail"><img src="${esc(a.thumbnail)}" alt="" loading="lazy"></div>`
		: '';

	return `<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="${esc(a.url)}" target="_blank" rel="noopener">${content}${thumb}</a></figure>`;
}

function galleryHtml(images: string[]): string {
	const rows: string[] = [];
	for (let i = 0; i < images.length; i += 3) {
		const slice = images.slice(i, i + 3);
		const cells = slice
			.map(
				(src) =>
					`<div class="kg-gallery-image"><img src="${esc(src)}" alt="" loading="lazy"></div>`
			)
			.join('');
		rows.push(`<div class="kg-gallery-row">${cells}</div>`);
	}
	return `<figure class="kg-card kg-gallery-card kg-width-wide"><div class="kg-gallery-container">${rows.join('')}</div></figure>`;
}

function embedHtml(a: Record<string, string | undefined>): string {
	if (a.html) return `<figure class="kg-card kg-embed-card">${a.html}</figure>`;
	const src = esc(a.url);
	const provider = (a.provider ?? '').toLowerCase();
	if (provider === 'instagram') {
		return `<figure class="kg-card kg-embed-card kg-embed-instagram"><iframe src="${src}" loading="lazy" allowfullscreen frameborder="0" scrolling="no" allowtransparency="true" allow="autoplay *; clipboard-write *; encrypted-media *; picture-in-picture *; web-share *"></iframe></figure>`;
	}
	if (provider === 'twitter' || provider === 'x') {
		return `<figure class="kg-card kg-embed-card kg-embed-twitter"><a href="${src}" target="_blank" rel="noopener" class="kg-embed-link"><span class="kg-embed-platform">View on X</span><span class="kg-embed-url">${src}</span></a></figure>`;
	}
	return `<figure class="kg-card kg-embed-card"><iframe src="${src}" loading="lazy" allowfullscreen frameborder="0"></iframe></figure>`;
}

// Mini pipeline to render the inner mdast children (e.g. callout body) to HTML
// without re-running the directive plugin.
const innerProcessor = unified()
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeStringify, { allowDangerousHtml: true });

function renderChildrenToHtml(children: Mdast[]): string {
	const wrapper: any = { type: 'root', children: children ?? [] };
	const hast = innerProcessor.runSync(wrapper as any);
	return innerProcessor.stringify(hast as any).toString();
}

function calloutHtml(a: Record<string, string | undefined>, children: Mdast[]): string {
	const inner = renderChildrenToHtml(children);
	const emoji = a.emoji ? `<span class="kg-callout-emoji">${esc(a.emoji)}</span>` : '';
	return `<div class="kg-callout-card">${emoji}<div class="kg-callout-text">${inner}</div></div>`;
}

function toggleHtml(a: Record<string, string | undefined>, children: Mdast[]): string {
	const inner = renderChildrenToHtml(children);
	return `<details class="kg-toggle-card"><summary>${esc(a.title ?? '')}</summary>${inner}</details>`;
}

function collectGalleryImages(node: Mdast): string[] {
	const images: string[] = [];
	visit(node, 'listItem', (li: any) => {
		const text = nodeToString(li).trim();
		if (text) images.push(text);
	});
	return images;
}

const KNOWN = new Set(['image', 'bookmark', 'gallery', 'embed', 'callout', 'toggle']);

export default function remarkGhostCards() {
	return (tree: any) => {
		// Walk the tree manually — visit's index/parent semantics get tricky when
		// we mutate children arrays. We handle replacement in-place and re-walk.
		walk(tree);
	};
}

function walk(node: any) {
	if (!node || !Array.isArray(node.children)) return;
	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		const replacement = transformIfDirective(child);
		if (replacement) {
			// Replacement may be one node or several
			node.children.splice(i, 1, ...replacement);
			i += replacement.length - 1;
		} else {
			walk(child);
		}
	}
}

function transformIfDirective(node: any): any[] | null {
	if (!node) return null;
	const t = node.type;
	const isDirective =
		t === 'containerDirective' || t === 'leafDirective' || t === 'textDirective';
	if (!isDirective) return null;

	const name = node.name as string;
	const attrs = (node.attributes ?? {}) as Record<string, string | undefined>;

	if (KNOWN.has(name)) {
		let html = '';
		switch (name) {
			case 'image':
				html = imageHtml(attrs);
				break;
			case 'bookmark':
				html = bookmarkHtml(attrs);
				break;
			case 'gallery':
				html = galleryHtml(collectGalleryImages(node));
				break;
			case 'embed':
				html = embedHtml(attrs);
				break;
			case 'callout':
				html = calloutHtml(attrs, node.children ?? []);
				break;
			case 'toggle':
				html = toggleHtml(attrs, node.children ?? []);
				break;
		}
		return [{ type: 'html', value: html }];
	}

	// Unknown directive — almost always a false positive from text like (2:177)
	// or 9:30 am. Reconstruct the original syntax as plain text so the surrounding
	// content reads correctly.
	return reconstructDirectiveAsText(node);
}

function reconstructDirectiveAsText(node: any): any[] {
	const t = node.type;
	const colons = t === 'containerDirective' ? ':::' : t === 'leafDirective' ? '::' : ':';
	const out: any[] = [{ type: 'text', value: colons + (node.name ?? '') }];

	// Inline children (label) — render their text content
	if (Array.isArray(node.children) && node.children.length > 0) {
		const labelText = nodeToString(node);
		if (labelText) {
			// Wrap children's text in [...] only if they were a textDirective
			// label. For container/leaf, keep the children as-is so paragraph
			// children stay block-level.
			if (t === 'textDirective') {
				out.push({ type: 'text', value: '[' + labelText + ']' });
			} else {
				// Container/leaf: emit the colons line, then children as their
				// own siblings.
				return [{ type: 'text', value: colons + (node.name ?? '') }, ...node.children];
			}
		}
	}

	// Attributes block { key=value … }
	if (node.attributes && Object.keys(node.attributes).length > 0) {
		const parts: string[] = [];
		for (const [k, v] of Object.entries(node.attributes)) {
			parts.push(`${k}="${String(v ?? '')}"`);
		}
		out.push({ type: 'text', value: '{' + parts.join(' ') + '}' });
	}
	return out;
}
