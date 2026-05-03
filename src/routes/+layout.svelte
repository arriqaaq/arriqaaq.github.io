<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TagPanel from '$lib/components/TagPanel.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/state';

	let { children } = $props();
	const breadcrumb = $derived(page.data.breadcrumb ?? '');
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
<div class="tag-panel-backdrop"></div>
