<script lang="ts">
	type Props = { size?: string };
	let { size = '3em' }: Props = $props();
</script>

<svg
	class="archive-lines"
	viewBox="0 0 80 60"
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
	<circle cx="10" cy="14" r="2" />
	<line x1="20" y1="14" x2="68" y2="14" />
	<circle cx="10" cy="26" r="2" />
	<line x1="20" y1="26" x2="58" y2="26" />
	<circle cx="10" cy="38" r="2" />
	<line x1="20" y1="38" x2="62" y2="38" />
	<circle cx="10" cy="50" r="2" />
	<line x1="20" y1="50" x2="48" y2="50" />
	<line x1="10" y1="6" x2="10" y2="56" opacity="0.4" />
</svg>
