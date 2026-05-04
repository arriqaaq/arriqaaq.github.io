<script lang="ts">
	import { settings, getTagById } from '$lib/content';
	import PostHeader from '$lib/components/PostHeader.svelte';
	import PostShare from '$lib/components/PostShare.svelte';
	import PostNextPrev from '$lib/components/PostNextPrev.svelte';
	import PostRelated from '$lib/components/PostRelated.svelte';
	import ReadingProgress from '$lib/components/ReadingProgress.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import Giscus from '$lib/components/Giscus.svelte';
	import { themeClass } from '$lib/themeForTag';

	let { data } = $props();
	const isPost = $derived(data.post.type === 'post');
	const primaryTagSlug = $derived(
		data.post.primary_tag ? (getTagById(data.post.primary_tag)?.slug ?? null) : null
	);
</script>

<svelte:head>
	<title>{data.post.title} — {settings.title}</title>
	{#if data.post.custom_excerpt}
		<meta name="description" content={data.post.custom_excerpt} />
	{/if}
</svelte:head>

{#if isPost}
	<ReadingProgress />
{/if}

<article class="reading {themeClass(primaryTagSlug)}" data-pagefind-body>
	<PostHeader post={data.post} />
	<div class="reading-body">
		{@html data.html}
	</div>
	{#if isPost}
		<PostShare title={data.post.title} slug={data.post.slug} />
	{/if}
</article>

{#if isPost}
	<PostNextPrev prev={data.prev} next={data.next} />
	<PostRelated primaryTagId={data.post.primary_tag} posts={data.related} />

	<Newsletter />
	<Giscus />
{/if}
