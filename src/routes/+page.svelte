<script lang="ts">
	import { base } from '$app/paths';
	import { settings, getReport } from '$lib/content';
	import PostCard from '$lib/components/PostCard.svelte';
	import PostCardLarge from '$lib/components/PostCardLarge.svelte';
	import FeaturedHero from '$lib/components/FeaturedHero.svelte';
	import KnowledgeStack from '$lib/components/KnowledgeStack.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import ReportPage from '$lib/components/report/ReportPage.svelte';
	import { themeClass } from '$lib/themeForTag';

	let { data } = $props();

	const introReport = getReport('arriqaaq-2026') ?? null;

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

{#if introReport}
	{@const firstChapter =
		introReport.chapters.find((c) => c.show_in_stepper) ?? introReport.chapters[0]}
	<section
		class="report-inline"
		class:u-theme-light={firstChapter?.theme === 'light'}
		class:u-theme-dark={firstChapter?.theme === 'dark'}
		style:--page-bg={firstChapter?.bg}
	>
		<ReportPage report={introReport} inline />
	</section>
{:else}
	<section class="hero hero--centered">
		<h1 class="hero-title">{settings.title}<span class="hero-title-accent">.</span></h1>
		{#if settings.description}
			<p class="hero-lede">{settings.description}</p>
		{/if}
	</section>
{/if}

<section class="focus-split">
	<div class="focus-copy">
		<h2 class="focus-title">What we focus on<span class="hero-title-accent">.</span></h2>
		<p class="focus-lede">
			The deen, from first principles. The six foundations we cover: Tajweed, Grammar, Aqeedah,
			Usul al-Hadith, Usul al-Fiqh, and Usul at-Tafsir — the roots before the branches.
		</p>
	</div>
	<div class="focus-visual">
		<KnowledgeStack />
	</div>
</section>

<section class="topic-strip">
	<small class="topic-strip-heading">Read by topic</small>
	<div class="topic-grid">
		{#each data.tags as t}
			<a href={`${base}/tag/${t.slug}/`} class="topic-card {themeClass(t.slug)}">
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
	<section class="releases theme--tajweed">
		<small class="releases-heading">Latest releases</small>
		<div class="releases-grid">
			{#each cardPosts as p}
				<PostCardLarge post={p} />
			{/each}
		</div>
	</section>
{/if}

{#if listPosts.length}
	<section class="intro-list theme--tajweed">
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

<section class="newsletter-callout theme--tajweed">
	<h2>Get new posts in your inbox</h2>
	<p>{settings.description}</p>
	<Newsletter />
</section>
