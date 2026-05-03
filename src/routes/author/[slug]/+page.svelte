<script lang="ts">
	import { base } from '$app/paths';
	import PostCard from '$lib/components/PostCard.svelte';
	import { resolveImage } from '$lib/content';
	import { settings } from '$lib/content';

	let { data } = $props();
	const avatar = $derived(resolveImage(data.author.profile_image, base));
</script>

<svelte:head>
	<title>{data.author.name} — {settings.title}</title>
	{#if data.author.bio}<meta name="description" content={data.author.bio} />{/if}
</svelte:head>

<header class="archive-header archive-header--author">
	{#if avatar}
		<img class="archive-avatar" src={avatar} alt={data.author.name} />
	{/if}
	<small class="related-heading">Author</small>
	<h1 class="archive-title">{data.author.name}</h1>
	{#if data.author.bio}
		<p class="archive-desc">{data.author.bio}</p>
	{/if}
	<p class="archive-count">{data.posts.length} post{data.posts.length === 1 ? '' : 's'}</p>
</header>

<div class="feed">
	{#each data.posts as p}
		<PostCard post={p} />
	{/each}
</div>
