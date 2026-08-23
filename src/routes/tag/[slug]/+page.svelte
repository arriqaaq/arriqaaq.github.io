<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { settings } from '$lib/content';
	import { themeClass } from '$lib/themeForTag';
	let { data } = $props();
</script>

<Seo
	title={`${data.tag.name} — ${settings.title}`}
	description={data.tag.description ?? settings.description}
/>

<div class={themeClass(data.tag.slug)}>
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
</div>
