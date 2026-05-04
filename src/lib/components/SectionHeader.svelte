<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		eyebrow?: string;
		heading: string;
		lede?: string;
		visual?: Snippet;
		rail?: boolean;
	};

	let { eyebrow, heading, lede, visual, rail = false }: Props = $props();
</script>

<header class="section-header" class:has-rail={rail}>
	{#if rail}<span class="section-rail" aria-hidden="true"></span>{/if}
	<div class="section-header-text">
		{#if eyebrow}<small class="section-eyebrow">{eyebrow}</small>{/if}
		<h2 class="section-heading">{heading}</h2>
		{#if lede}<p class="section-lede">{lede}</p>{/if}
	</div>
	{#if visual}
		<div class="section-visual">{@render visual()}</div>
	{/if}
</header>
