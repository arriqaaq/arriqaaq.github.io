<script lang="ts">
	type Props = { progress: number; size?: number; stroke?: number };
	let { progress, size = 36, stroke = 2 }: Props = $props();

	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
	const clamped = $derived(Math.min(1, Math.max(0, progress)));
	const dashoffset = $derived(c * (1 - clamped));
</script>

<svg
	class="report-progress-ring"
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	aria-hidden="true"
>
	<circle
		class="track"
		cx={size / 2}
		cy={size / 2}
		r={r}
		fill="none"
		stroke="currentColor"
		stroke-opacity="0.15"
		stroke-width={stroke}
	/>
	<circle
		class="fill"
		cx={size / 2}
		cy={size / 2}
		r={r}
		fill="none"
		stroke="currentColor"
		stroke-width={stroke}
		stroke-linecap="round"
		stroke-dasharray="{c} {c}"
		stroke-dashoffset={dashoffset}
		transform="rotate(-90 {size / 2} {size / 2})"
	/>
</svg>

<style>
	.report-progress-ring {
		position: absolute;
		inset: 0;
		margin: auto;
		pointer-events: none;
	}
	.fill {
		transition: stroke-dashoffset 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
</style>
