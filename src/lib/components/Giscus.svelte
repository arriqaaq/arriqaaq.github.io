<script lang="ts">
	import { onMount } from 'svelte';
	import { GISCUS } from '$lib/giscus-config';

	type Props = { mapping?: string };
	let { mapping = 'pathname' }: Props = $props();

	let mountEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (!GISCUS.repo || !GISCUS.repoId || !GISCUS.categoryId) return;
		const s = document.createElement('script');
		s.src = 'https://giscus.app/client.js';
		s.async = true;
		s.crossOrigin = 'anonymous';
		s.dataset.repo = GISCUS.repo;
		s.dataset.repoId = GISCUS.repoId;
		s.dataset.category = GISCUS.category;
		s.dataset.categoryId = GISCUS.categoryId;
		s.dataset.mapping = mapping;
		s.dataset.strict = '0';
		s.dataset.reactionsEnabled = '1';
		s.dataset.emitMetadata = '0';
		s.dataset.inputPosition = 'top';
		s.dataset.theme = 'light';
		s.dataset.lang = 'en';
		s.dataset.loading = 'lazy';
		mountEl?.appendChild(s);
	});
</script>

{#if GISCUS.repo}
	<section class="comments" aria-label="Discussion">
		<small class="related-heading">Discussion</small>
		<div bind:this={mountEl}></div>
	</section>
{/if}

<style>
	.comments {
		max-width: var(--reading-w);
		margin: 48px auto;
	}
</style>
