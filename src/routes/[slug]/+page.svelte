<script lang="ts">
	import { settings, getTagById, getAuthorById } from '$lib/content';
	import { SITE_URL, postUrl } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
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
	const seoDescription = $derived(
		(data.post.custom_excerpt ?? data.post.plaintext.slice(0, 200)).replace(/\s+/g, ' ').trim()
	);
	const author = $derived(
		data.post.primary_author ? (getAuthorById(data.post.primary_author) ?? null) : null
	);
	const jsonLd = $derived(
		isPost
			? {
					'@context': 'https://schema.org',
					'@type': 'BlogPosting',
					headline: data.post.title,
					description: seoDescription,
					datePublished: data.post.published_at,
					dateModified: data.post.updated_at,
					wordCount: data.post.words,
					url: postUrl(data.post.slug),
					mainEntityOfPage: postUrl(data.post.slug),
					...(data.post.feature_image
						? {
								image: data.post.feature_image.startsWith('http')
									? data.post.feature_image
									: SITE_URL + data.post.feature_image
							}
						: {}),
					...(author
						? {
								author: {
									'@type': 'Person',
									name: author.name,
									url: `${SITE_URL}/author/${author.slug}/`
								}
							}
						: {})
				}
			: null
	);
</script>

<Seo
	title={`${data.post.title} — ${settings.title}`}
	description={seoDescription}
	image={data.post.feature_image}
	type={isPost ? 'article' : 'website'}
	publishedAt={isPost ? data.post.published_at : null}
	updatedAt={isPost ? data.post.updated_at : null}
	markdownAlt
	{jsonLd}
/>

{#if isPost}
	<ReadingProgress />
{/if}

<article class="reading {themeClass(primaryTagSlug)}" data-pagefind-body>
	<PostHeader post={data.post} />
	{#if isPost && data.post.toc?.length > 1}
		<nav class="toc" aria-label="Contents" data-pagefind-ignore>
			<h2 class="toc-title">Contents</h2>
			<ol>
				{#each data.post.toc as entry, i (entry.id)}
					<li>
						<span class="toc-n">{String(i + 1).padStart(2, '0')}</span>
						<a href={`#${entry.id}`}>{entry.text}</a>
					</li>
				{/each}
			</ol>
		</nav>
	{/if}
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
