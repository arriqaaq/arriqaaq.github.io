<script lang="ts">
	type Props = { size?: string };
	let { size = '3em' }: Props = $props();
</script>

<svg
	class="topic-glyphs"
	viewBox="0 0 200 40"
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
	<circle cx="20" cy="20" r="12" />
	<polygon points="60,8 72,20 60,32 48,20" />
	<polygon points="100,8 108,16 116,20 108,24 100,32 92,24 84,20 92,16" />
	<rect x="132" y="8" width="24" height="24" transform="rotate(45 144 20)" />
	<g transform="translate(180 20)">
		<line x1="-10" y1="0" x2="10" y2="0" />
		<line x1="0" y1="-10" x2="0" y2="10" />
		<line x1="-7" y1="-7" x2="7" y2="7" />
		<line x1="-7" y1="7" x2="7" y2="-7" />
	</g>
</svg>
