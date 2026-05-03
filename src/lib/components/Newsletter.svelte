<script lang="ts">
	import { onMount } from 'svelte';

	const FORM_ID = 'd1727b0c-4722-11f1-9222-85cbb0e7783f';
	const SCRIPT_SRC = `https://eomail5.com/form/${FORM_ID}.js`;

	let mountEl: HTMLDivElement;

	onMount(() => {
		const s = document.createElement('script');
		s.src = SCRIPT_SRC;
		s.async = true;
		s.dataset.form = FORM_ID;
		mountEl.appendChild(s);
	});
</script>

<div class="newsletter-embed" bind:this={mountEl}></div>

<style>
	.newsletter-embed {
		margin: 24px auto;
		max-width: var(--reading-w);
	}
	.newsletter-embed :global(form),
	.newsletter-embed :global(.eomail-form) {
		font-family: var(--font-ui);
	}
</style>
