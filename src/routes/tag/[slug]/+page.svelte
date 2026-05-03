<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { settings } from '$lib/content';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.tag.name} — {settings.title}</title>
	{#if data.tag.description}<meta name="description" content={data.tag.description} />{/if}
</svelte:head>

<header class="archive-header">
	<small class="related-heading">Tag</small>
	<h1 class="archive-title">{data.tag.name}</h1>
	{#if data.tag.description}
		<p class="archive-desc">{data.tag.description}</p>
	{/if}
	<p class="archive-count">{data.posts.length} post{data.posts.length === 1 ? '' : 's'}</p>
</header>

<div class="feed">
	{#each data.posts as p}
		<PostCard post={p} />
	{/each}
</div>
