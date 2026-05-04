<script lang="ts">
	type Props = { size?: string };
	let { size = '3em' }: Props = $props();
</script>

<svg
	class="newsletter-mark"
	viewBox="0 0 60 60"
	width={size}
	height="auto"
	role="presentation"
	aria-hidden="true"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M6 30 L54 8 L42 52 L26 36 Z" />
	<path d="M6 30 L26 36" />
	<path d="M26 36 L54 8" opacity="0.4" />
</svg>
