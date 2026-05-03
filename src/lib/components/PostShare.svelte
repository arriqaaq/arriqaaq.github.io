<script lang="ts">
	import { base } from '$app/paths';
	import Icon from './Icon.svelte';

	type Props = { title: string; slug: string };
	let { title, slug }: Props = $props();

	let copied = $state(false);

	function url() {
		if (typeof window !== 'undefined') return window.location.href;
		return `${base}/${slug}/`;
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(url());
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// ignore
		}
	}
</script>

<div class="post-share">
	<a
		href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`}
		target="_blank"
		rel="noopener"
		aria-label="Share on X"><Icon name="x" /></a
	>
	<a
		href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url())}`}
		aria-label="Share by email"><Icon name="mail" /></a
	>
	<button
		type="button"
		class="copy-link"
		class:is-copied={copied}
		aria-label="Copy link"
		onclick={copy}><Icon name="chevron" /></button
	>
</div>
