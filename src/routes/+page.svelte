<script lang="ts">
	import { base } from '$app/paths';
	import { settings } from '$lib/content';
	import { resolveImage } from '$lib/content';
	import PostCard from '$lib/components/PostCard.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';

	let { data } = $props();

	const heroImg = $derived(resolveImage(data.hero?.feature_image, base));
	const heroDate = $derived(
		data.hero
			? new Date(data.hero.published_at).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			: ''
	);
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
		<div class="hero-cta">
			<a href="#latest" class="btn btn--primary">Latest writing</a>
		</div>
	</div>
	<div class="hero-right">
		{#if data.hero}
			<a href={`${base}/${data.hero.slug}/`} class="hero-card">
				{#if heroImg}
					<div class="hero-card-image"><img src={heroImg} alt={data.hero.title} loading="lazy" /></div>
				{/if}
				<div class="hero-card-body">
					<span class="hero-card-eyebrow">Latest</span>
					<h3 class="hero-card-title">{data.hero.title}</h3>
					<span class="hero-card-meta">{heroDate} · {data.hero.reading_time} min read</span>
				</div>
			</a>
		{/if}
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

{#if data.featured.length}
	<section class="featured-section">
		<small class="related-heading">Featured</small>
		<div class="feed">
			{#each data.featured as p}
				<PostCard post={p} />
			{/each}
		</div>
	</section>
{/if}

<hr class="section-rule" id="latest" />
<small class="related-heading">Recent</small>
<div class="feed">
	{#each data.recent as p, i}
		<PostCard post={p} isHero={i === 0} />
	{/each}
</div>

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
