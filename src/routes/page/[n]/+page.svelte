<script lang="ts">
	import { base } from '$app/paths';
	import PostCard from '$lib/components/PostCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { settings } from '$lib/content';

	let { data } = $props();
</script>

<Seo title={`Page ${data.page} — ${settings.title}`} markdownAlt />

<header class="archive-header">
	<small class="related-heading">Page {data.page} of {data.totalPages}</small>
</header>

<div class="feed">
	{#each data.posts as p}
		<PostCard post={p} />
	{/each}
</div>

<div class="pagination-wrap">
	{#if data.page > 2}
		<a href={`${base}/page/${data.page - 1}/`} class="btn">← Newer</a>
	{:else if data.page === 2}
		<a href={`${base}/`} class="btn">← Newer</a>
	{/if}
	{#if data.page < data.totalPages}
		<a href={`${base}/page/${data.page + 1}/`} class="btn">Older →</a>
	{/if}
</div>
