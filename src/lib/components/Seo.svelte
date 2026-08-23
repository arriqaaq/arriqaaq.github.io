<script lang="ts">
	import { page } from '$app/state';
	import { settings } from '$lib/content';
	import { SITE_URL } from '$lib/site';

	let {
		title = settings.title,
		description = settings.description,
		image = null,
		type = 'website',
		publishedAt = null,
		updatedAt = null,
		markdownAlt = false,
		jsonLd = null
	}: {
		title?: string;
		description?: string;
		image?: string | null;
		type?: 'website' | 'article';
		publishedAt?: string | null;
		updatedAt?: string | null;
		markdownAlt?: boolean;
		jsonLd?: object | object[] | null;
	} = $props();

	const canonical = $derived(SITE_URL + page.url.pathname);
	const ogImage = $derived(
		image ? (image.startsWith('http') ? image : SITE_URL + image) : null
	);
	// A literal closing script tag may not appear inside the markup — build it
	// by concatenation; escape '<' inside the JSON payload.
	const ldScript = $derived(
		jsonLd
			? '<script type="application/ld+json">' +
					JSON.stringify(jsonLd).replace(/</g, '\\u003c') +
					'<' +
					'/script>'
			: null
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:site_name" content={settings.title} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	{#if publishedAt}
		<meta property="article:published_time" content={publishedAt} />
	{/if}
	{#if updatedAt}
		<meta property="article:modified_time" content={updatedAt} />
	{/if}
	<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
	<link
		rel="alternate"
		type="application/rss+xml"
		title={settings.title}
		href={`${SITE_URL}/rss.xml`}
	/>
	{#if markdownAlt}
		<link rel="alternate" type="text/markdown" title="Markdown" href={`${canonical}index.md`} />
	{/if}
	{#if ldScript}
		{@html ldScript}
	{/if}
</svelte:head>
