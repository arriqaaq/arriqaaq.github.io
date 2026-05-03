<script lang="ts">
	import { base } from '$app/paths';
	import type { Post } from '$lib/types';

	type Props = { prev: Post | null; next: Post | null };
	let { prev, next }: Props = $props();
</script>

<nav class="nextprev" aria-label="More posts">
	{#if prev}
		<a href={`${base}/${prev.slug}/`} class="nextprev--older">
			<span class="label">Older</span>
			<span class="title">{prev.title}</span>
		</a>
	{/if}
	{#if next}
		<a href={`${base}/${next.slug}/`} class="nextprev--newer">
			<span class="label">Newer</span>
			<span class="title">{next.title}</span>
		</a>
	{/if}
</nav>
