<script lang="ts">
	import { base } from '$app/paths';
	import { getTagById } from '$lib/content';
	import type { Post } from '$lib/types';

	type Props = { post: Post };
	let { post }: Props = $props();

	const primaryTag = $derived(post.primary_tag ? getTagById(post.primary_tag) : null);
	const dateLabel = $derived(
		new Date(post.published_at).toLocaleDateString(undefined, {
			month: 'long', day: 'numeric', year: 'numeric'
		})
	);
	const excerpt = $derived(post.custom_excerpt ?? post.plaintext.slice(0, 110) + '…');
</script>

<a class="release-card" href={`${base}/${post.slug}/`}>
	<h3 class="release-card-title">{post.title}</h3>
	<p class="release-card-excerpt">{excerpt}</p>
	<div class="release-card-spacer"></div>
	<dl class="release-card-meta">
		<div class="release-card-meta-row">
			<dt>Date</dt>
			<dd>{dateLabel}</dd>
		</div>
		<div class="release-card-meta-row">
			<dt>Category</dt>
			<dd>{primaryTag?.name ?? 'Post'}</dd>
		</div>
	</dl>
	<span class="release-card-cta">Read the post <span aria-hidden="true">→</span></span>
</a>
