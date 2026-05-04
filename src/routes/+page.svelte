<script lang="ts">
	import { base } from '$app/paths';
	import { settings } from '$lib/content';
	import PostCard from '$lib/components/PostCard.svelte';
	import PostCardLarge from '$lib/components/PostCardLarge.svelte';
	import FeaturedHero from '$lib/components/FeaturedHero.svelte';
	import KnowledgeStack from '$lib/components/KnowledgeStack.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';

	let { data } = $props();

	const ordered = $derived([...data.featured, ...data.recent]);
	const heroPost = $derived(ordered[0] ?? null);
	const cardPosts = $derived(ordered.slice(1, 4));
	const listPosts = $derived(ordered.slice(4));

	const tagline = 'A creative space for authentic Islamic articles, courses, and reflections on education, lifestyle, and technology.';
</script>

<svelte:head>
	<title>{settings.title}</title>
	<meta name="description" content={settings.description} />
</svelte:head>

<section class="hero hero--split">
	<div class="hero-left">
		<h1 class="hero-title">{settings.title}<span class="hero-title-accent">.</span></h1>
		{#if settings.description}
			<p class="hero-lede">{settings.description}</p>
		{/if}
	</div>
	<div class="hero-right">
		<KnowledgeStack />
	</div>
</section>

<section class="topic-strip">
	<small class="topic-strip-heading">Read by topic</small>
	<div class="topic-grid">
		{#each data.tags as t}
			<a href={`${base}/tag/${t.slug}/`} class="topic-card">
				<span class="topic-name">{t.name}</span>
				<span class="topic-count">{t.post_count}</span>
			</a>
		{/each}
	</div>
</section>

<hr class="section-rule" id="latest" />

{#if heroPost}
	<FeaturedHero post={heroPost} />
{/if}

{#if cardPosts.length}
	<section class="releases">
		<small class="releases-heading">Latest releases</small>
		<div class="releases-grid">
			{#each cardPosts as p}
				<PostCardLarge post={p} />
			{/each}
		</div>
	</section>
{/if}

{#if listPosts.length}
	<section class="intro-list">
		<aside class="intro-tagline">
			<p>{tagline}</p>
		</aside>
		<div class="intro-list-feed">
			{#each listPosts as p}
				<PostCard post={p} />
			{/each}
		</div>
	</section>
{/if}

{#if data.totalPages > 1}
	<div class="pagination-wrap">
		<a href={`${base}/page/2/`} class="btn">Older posts →</a>
	</div>
{/if}

<section class="newsletter-callout">
	<h2>Get new posts in your inbox</h2>
	<p>{settings.description}</p>
	<Newsletter />
</section>
