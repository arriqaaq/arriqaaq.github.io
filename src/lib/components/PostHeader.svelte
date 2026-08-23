<script lang="ts">
	import { base } from '$app/paths';
	import { getTagById, getAuthorById } from '$lib/content';
	import { resolveImage } from '$lib/content';
	import type { Post } from '$lib/types';

	type Props = { post: Post };
	let { post }: Props = $props();

	const primaryTag = $derived(post.primary_tag ? getTagById(post.primary_tag) : null);
	const primaryAuthor = $derived(post.primary_author ? getAuthorById(post.primary_author) : null);
	const featureImg = $derived(resolveImage(post.feature_image, base));
	const avatar = $derived(resolveImage(primaryAuthor?.profile_image ?? null, base));
	const dateLabel = $derived(
		new Date(post.published_at).toLocaleDateString(undefined, {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	);
	const statsLabel = $derived.by(() => {
		const parts = [`~${(post.words ?? 0).toLocaleString('en-US')} words`];
		if (post.widgets?.length) {
			parts.push(`${post.widgets.length} interactive widget${post.widgets.length === 1 ? '' : 's'}`);
		}
		if (post.diagram_count) {
			parts.push(`${post.diagram_count} diagram${post.diagram_count === 1 ? '' : 's'}`);
		}
		return parts.join(' · ');
	});
</script>

<header class="reading-meta">
	{#if primaryTag}
		<a href={`${base}/tag/${primaryTag.slug}/`} class="chip">{primaryTag.name}</a>
	{/if}
	<time datetime={post.published_at.slice(0, 10)}>{dateLabel}</time>
	<span>{post.reading_time} min read</span>
</header>
<h1 class="reading-title">{post.title}</h1>
{#if post.custom_excerpt}
	<p class="reading-subtitle">{post.custom_excerpt}</p>
{/if}
{#if primaryAuthor}
	<div class="reading-byline">
		{#if avatar}
			<img class="reading-byline-avatar" src={avatar} alt={primaryAuthor.name} />
		{:else}
			<span class="reading-byline-avatar"></span>
		{/if}
		<span>{primaryAuthor.name}</span>
		{#if post.words}
			<span class="reading-stats">{statsLabel}</span>
		{/if}
	</div>
{/if}
{#if featureImg && post.show_title_and_feature_image}
	<figure class="reading-feature">
		<img src={featureImg} alt={post.title} loading="eager" />
	</figure>
{/if}
