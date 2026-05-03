<script lang="ts">
	import { base } from '$app/paths';
	import { getTagById } from '$lib/content';
	import { resolveImage } from '$lib/content';
	import type { Post } from '$lib/types';

	type Props = { post: Post; isHero?: boolean };
	let { post, isHero = false }: Props = $props();

	const dateLabel = $derived(
		new Date(post.published_at).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);
	const tags = $derived(post.tags.slice(0, 3).map(getTagById).filter(Boolean));
	const img = $derived(resolveImage(post.feature_image, base));
	const excerpt = $derived(
		post.custom_excerpt ?? (isHero ? post.plaintext.slice(0, 240) + '…' : null)
	);
</script>

<article class="feed-item" class:feed-item--hero={isHero}>
	{#if img}
		<a href={`${base}/${post.slug}/`} class="feed-item-image" aria-hidden="true" tabindex="-1">
			<img src={img} alt={post.title} loading="lazy" />
		</a>
	{/if}
	<div class="feed-item-body">
		{#if tags.length}
			<div class="feed-item-tags">
				{#each tags as t}
					<a href={`${base}/tag/${t!.slug}/`} class="chip">{t!.name}</a>
				{/each}
			</div>
		{/if}
		<h2 class="feed-item-title">
			<a href={`${base}/${post.slug}/`}>{post.title}</a>
		</h2>
		{#if isHero && excerpt}
			<p class="feed-item-excerpt">{excerpt}</p>
		{/if}
		<div class="feed-item-meta">
			<time datetime={post.published_at.slice(0, 10)}>{dateLabel}</time>
			· {post.reading_time} min read
		</div>
	</div>
</article>
