/**
 * Interactive widget registry, referenced from markdown as `[[WIDGET:name]]`
 * on its own line. Each entry: { g: global init name, t: title, s: subtitle }.
 *
 * The registry is currently EMPTY — the mount mechanism is wired end-to-end,
 * so adding a widget later is purely additive:
 *
 * 1. Register it here:
 *      export const widgets = { 'tick-loop': { g: 'TickLoop', t: 'The tick loop', s: '…' } };
 *
 * 2. The parser emits, wherever `[[WIDGET:tick-loop]]` appears:
 *      <figure class="fig fig-widget">
 *        <div class="widget-mount" data-widget="tick-loop" id="w-tick-loop-1"></div>
 *        <figcaption>Interactive — {title}</figcaption>
 *      </figure>
 *    and records the widget name on the post's `widgets: string[]` field.
 *
 * 3. Hydration (to build when the first widget lands): a `WidgetHydrator.svelte`
 *    rendered from `src/routes/[slug]/+page.svelte` when `post.widgets.length > 0`.
 *    In onMount (browser-only, prerender-safe) it loads implementations via
 *    `import.meta.glob('$lib/widgets/*.ts')`, keyed by `data.post.widgets`, then
 *    for each `document.querySelectorAll('.widget-mount')` element calls the
 *    module's `init(el.id)`. Widget modules own their DOM inside the mount div.
 *
 * Nothing outside this file and $lib/widgets/ needs to change when widgets land.
 */

export type WidgetMeta = { g: string; t: string; s: string };

export const widgets: Record<string, WidgetMeta> = {};
