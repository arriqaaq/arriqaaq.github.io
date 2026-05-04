<script lang="ts">
	import Icon from './Icon.svelte';
	import PagefindUI from './PagefindUI.svelte';

	type Props = { breadcrumb?: string };
	let { breadcrumb = '' }: Props = $props();
	let searchOpen = $state(false);
</script>

<header class="topbar">
	<button type="button" class="icon-btn topbar-panel-toggle" aria-label="Toggle panel" title="Toggle panel ([)">
		<Icon name="panel" />
	</button>
	<span class="breadcrumb">{breadcrumb}</span>
	<div class="topbar-spacer"></div>
	<button type="button" class="search-trigger" aria-label="Search" onclick={() => (searchOpen = true)}>
		<Icon name="search" />
		<span>Search…</span>
		<span class="kbd">⌘K</span>
	</button>
</header>

<PagefindUI bind:open={searchOpen} />
