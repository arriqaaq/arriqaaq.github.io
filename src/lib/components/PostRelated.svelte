<script lang="ts">
	import { getTagById } from '$lib/content';
	import PostCard from './PostCard.svelte';
	import type { Post } from '$lib/types';

	type Props = { primaryTagId: string | null; posts: Post[] };
	let { primaryTagId, posts }: Props = $props();

	const tagName = $derived(primaryTagId ? getTagById(primaryTagId)?.name : null);
</script>

{#if posts.length}
	<section class="related">
		<small class="related-heading">{tagName ? `More in ${tagName}` : 'More posts'}</small>
		<div class="feed">
			{#each posts as p}
				<PostCard post={p} />
			{/each}
		</div>
	</section>
{/if}
