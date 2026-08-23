<script lang="ts">
	import { base } from '$app/paths';
	import { settings, authors, getReport } from '$lib/content';
	import { SITE_URL } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import PostCardLarge from '$lib/components/PostCardLarge.svelte';
	import FeaturedHero from '$lib/components/FeaturedHero.svelte';
	import KnowledgeStack from '$lib/components/KnowledgeStack.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import ReportPage from '$lib/components/report/ReportPage.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import TopicGlyphs from '$lib/components/TopicGlyphs.svelte';
	import ReleaseStack from '$lib/components/ReleaseStack.svelte';
	import ArchiveLines from '$lib/components/ArchiveLines.svelte';
	import NewsletterMark from '$lib/components/NewsletterMark.svelte';
	import { themeClass } from '$lib/themeForTag';

	let { data } = $props();

	const introReport = getReport('arriqaaq-2026') ?? null;

	const ordered = $derived([...data.featured, ...data.recent]);
	const heroPost = $derived(ordered[0] ?? null);
	const cardPosts = $derived(ordered.slice(1, 4));
	const listPosts = $derived(ordered.slice(4));

	const jsonLd = [
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: settings.title,
			url: `${SITE_URL}/`,
			description: settings.description
		},
		...authors.slice(0, 1).map((a) => ({
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: a.name,
			url: `${SITE_URL}/author/${a.slug}/`
		}))
	];
</script>

<Seo {jsonLd} />

{#if introReport}
	{@const firstChapter =
		introReport.chapters.find((c) => c.show_in_stepper) ?? introReport.chapters[0]}
	<section
		class="report-inline theme--tajweed"
		class:u-theme-light={firstChapter?.theme === 'light'}
		class:u-theme-dark={firstChapter?.theme === 'dark'}
		style:--page-bg={firstChapter?.bg}
	>
		<ReportPage report={introReport} />
	</section>
{:else}
	<section class="hero hero--centered">
		<h1 class="hero-title">{settings.title}<span class="hero-title-accent">.</span></h1>
		{#if settings.description}
			<p class="hero-lede">{settings.description}</p>
		{/if}
	</section>
{/if}

<section class="focus-split theme--tajweed">
	<SectionHeader
		heading="What we focus on"
		lede="The deen, from first principles. The six foundations we cover: Tajweed, Grammar, Aqeedah, Usul al-Hadith, Usul al-Fiqh, and Usul at-Tafsir — the roots before the branches."
		rail
	>
		{#snippet visual()}
			<KnowledgeStack />
		{/snippet}
	</SectionHeader>
</section>

<section class="topic-strip theme--tajweed">
	<SectionHeader heading="Browse by discipline">
		{#snippet visual()}
			<TopicGlyphs />
		{/snippet}
	</SectionHeader>
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
		<SectionHeader heading="Latest from the desk" rail>
			{#snippet visual()}
				<ReleaseStack />
			{/snippet}
		</SectionHeader>
		<div class="releases-grid">
			{#each cardPosts as p}
				<PostCardLarge post={p} />
			{/each}
		</div>
	</section>
{/if}

{#if listPosts.length}
	<section class="intro-list theme--tajweed">
		<SectionHeader heading="More reading" rail>
			{#snippet visual()}
				<ArchiveLines />
			{/snippet}
		</SectionHeader>
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
	<SectionHeader heading="Get new posts in your inbox" lede={settings.description} rail>
		{#snippet visual()}
			<NewsletterMark />
		{/snippet}
	</SectionHeader>
	<Newsletter />
</section>
