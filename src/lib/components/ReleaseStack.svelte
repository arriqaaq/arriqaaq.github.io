<script lang="ts">
	type Props = { size?: string };
	let { size = '3em' }: Props = $props();
</script>

<svg
	class="release-stack"
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
	<rect x="14" y="6" width="44" height="32" rx="2" transform="rotate(-4 36 22)" opacity="0.5" />
	<rect x="18" y="14" width="44" height="32" rx="2" transform="rotate(2 40 30)" opacity="0.75" />
	<rect x="14" y="22" width="44" height="32" rx="2" />
	<line x1="22" y1="32" x2="50" y2="32" />
	<line x1="22" y1="38" x2="42" y2="38" />
	<line x1="22" y1="44" x2="46" y2="44" />
</svg>
