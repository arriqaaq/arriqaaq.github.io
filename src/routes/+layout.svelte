<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TagPanel from '$lib/components/TagPanel.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';
	import { reports } from '$lib/content';
	import { onMount } from 'svelte';

	let { children } = $props();
	const breadcrumb = $derived(page.data.breadcrumb ?? '');

	const activeReport = $derived(
		page.state.reportSlug
			? (reports.find((r) => r.slug === page.state.reportSlug) ?? null)
			: null
	);

	// Convert any <a href="/report/<slug>"> click into a shallow-routing overlay open.
	// Modifier-clicks fall through to native nav so users can still open in a new tab.
	function onClickCapture(e: MouseEvent) {
		if (e.defaultPrevented) return;
		if (e.button !== 0) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const target = (e.target as HTMLElement | null)?.closest?.('a');
		if (!target || target.target === '_blank') return;
		const href = target.getAttribute('href') ?? '';
		const m = /^\/report\/([^/?#]+)\/?$/.exec(href);
		if (!m) return;
		const slug = m[1];
		const found = reports.find((r) => r.slug === slug);
		if (!found) return;
		e.preventDefault();
		pushState(href, { reportSlug: slug });
	}

	onMount(() => {
		document.addEventListener('click', onClickCapture);
		return () => document.removeEventListener('click', onClickCapture);
	});
</script>

<div class="app panel-collapsed">
	<Sidebar />
	<TagPanel />
	<Topbar {breadcrumb} />
	<main class="main">
		<div class="container">
			{@render children()}
		</div>
		<Footer />
	</main>
</div>

{#if activeReport}
	{#await import('$lib/components/report/ReportOverlay.svelte') then { default: ReportOverlay }}
		<ReportOverlay report={activeReport} />
	{/await}
{/if}
