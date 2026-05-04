<script lang="ts">
	import { base } from '$app/paths';
	import { getTagById } from '$lib/content';
	import type { Post } from '$lib/types';

	type Props = { post: Post; isHero?: boolean };
	let { post }: Props = $props();

	const primaryTag = $derived(post.primary_tag ? getTagById(post.primary_tag) : null);
</script>

<a class="post-row" href={`${base}/${post.slug}/`}>
	<h2 class="post-row-title">{post.title}</h2>
	<span class="post-row-category">{primaryTag?.name ?? 'Post'}</span>
</a>
