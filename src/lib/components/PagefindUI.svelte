<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';

	type Props = { open: boolean };
	let { open = $bindable() }: Props = $props();

	let mountEl: HTMLDivElement | undefined = $state();
	let initialized = false;

	const SCRIPT_SRC = `${base}/pagefind/pagefind-ui.js`;
	const STYLE_HREF = `${base}/pagefind/pagefind-ui.css`;

	function loadScriptOnce(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
			if (existing) {
				if ((existing as any).dataset.loaded === '1') return resolve();
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error(`Failed: ${src}`)), { once: true });
				return;
			}
			const s = document.createElement('script');
			s.src = src;
			s.async = true;
			s.onload = () => {
				s.dataset.loaded = '1';
				resolve();
			};
			s.onerror = () => reject(new Error(`Failed: ${src}`));
			document.head.appendChild(s);
		});
	}

	function loadStyleOnce(href: string) {
		if (document.querySelector(`link[href="${href}"]`)) return;
		const l = document.createElement('link');
		l.rel = 'stylesheet';
		l.href = href;
		document.head.appendChild(l);
	}

	async function init() {
		if (initialized) return;
		await tick(); // wait for {#if open} to mount the dialog so mountEl is bound
		if (!mountEl) return;
		try {
			loadStyleOnce(STYLE_HREF);
			await loadScriptOnce(SCRIPT_SRC);
			const PagefindUI = (window as any).PagefindUI;
			if (typeof PagefindUI !== 'function') {
				console.warn('PagefindUI not on window after script load');
				return;
			}
			new PagefindUI({
				element: mountEl,
				bundlePath: `${base}/pagefind/`,
				showImages: false,
				showSubResults: true,
				resetStyles: false,
				autofocus: true
			});
			initialized = true;
			// Focus the input that PagefindUI just rendered
			await tick();
			const input = mountEl.querySelector<HTMLInputElement>('input[type="text"]');
			input?.focus();
		} catch (err) {
			console.warn('Pagefind init failed:', err);
		}
	}

	$effect(() => {
		if (open) void init();
		else initialized = false;
	});

	function close() {
		open = false;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			open = true;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div class="search-overlay" role="dialog" aria-modal="true">
		<button class="search-overlay-backdrop" aria-label="Close search" onclick={close}></button>
		<div class="search-overlay-panel">
			<button class="search-overlay-close" aria-label="Close" onclick={close}>×</button>
			<div bind:this={mountEl} class="pagefind-mount"></div>
		</div>
	</div>
{/if}

<style>
	.search-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 80px;
	}
	.search-overlay-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(26, 26, 26, 0.4);
		border: 0;
		padding: 0;
		cursor: pointer;
	}
	.search-overlay-panel {
		position: relative;
		background: var(--cream);
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		box-shadow: var(--shadow-md);
		width: min(720px, calc(100vw - 32px));
		max-height: calc(100vh - 160px);
		overflow: auto;
		padding: 24px;
	}
	.search-overlay-close {
		position: absolute;
		top: 8px;
		right: 12px;
		font-size: 28px;
		line-height: 1;
		color: var(--ink-muted);
		background: none;
		border: 0;
		cursor: pointer;
	}
	.pagefind-mount :global(.pagefind-ui__form) {
		font-family: var(--font-ui);
	}
</style>
