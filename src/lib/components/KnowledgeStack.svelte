<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	type Level = {
		key: string;
		label: string;
		glyph: string;
		from: string;
		to: string;
		shadow: string;
	};

	const levels: Level[] = [
		{ key: 'tajweed', label: 'Tajweed',        glyph: 'ت', from: '#f59e0b', to: '#b45309', shadow: '#d97706' },
		{ key: 'grammar', label: 'Grammar',        glyph: 'ن', from: '#3b82f6', to: '#1e3a8a', shadow: '#2563eb' },
		{ key: 'aqeedah', label: 'Aqeedah',        glyph: 'ع', from: '#10b981', to: '#065f46', shadow: '#059669' },
		{ key: 'hadith',  label: 'Usul al-Hadith', glyph: 'ح', from: '#8b5cf6', to: '#4c1d95', shadow: '#7c3aed' },
		{ key: 'fiqh',    label: 'Usul al-Fiqh',   glyph: 'ف', from: '#f43f5e', to: '#9f1239', shadow: '#e11d48' },
		{ key: 'tafsir',  label: 'Usul at-Tafsir', glyph: 'ت', from: '#14b8a6', to: '#115e59', shadow: '#0d9488' }
	];

	const N = levels.length;
	const CENTER_IDX = (N - 1) / 2;

	let phase = $state<'drop' | 'dissect' | 'cycle'>('drop');
	let active = $state(0);
	let cycleTimer: ReturnType<typeof setInterval> | null = null;
	const timeouts: ReturnType<typeof setTimeout>[] = [];

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			phase = 'cycle';
			return;
		}
		timeouts.push(setTimeout(() => (phase = 'dissect'), 520));
		timeouts.push(
			setTimeout(() => {
				phase = 'cycle';
				cycleTimer = setInterval(() => {
					active = (active + 1) % levels.length;
				}, 1400);
			}, 1320)
		);
	});

	onDestroy(() => {
		if (cycleTimer) clearInterval(cycleTimer);
		timeouts.forEach((t) => clearTimeout(t));
	});
</script>

<div
	class="kstack phase-{phase}"
	style="--n: {N}; --center-idx: {CENTER_IDX};"
	role="img"
	aria-label="Foundations of Islamic knowledge: Tajweed, Grammar, Aqeedah, Usul al-Hadith, Usul al-Fiqh, Usul at-Tafsir"
>
	<div class="cube-area">
		<div class="cube">
			<div class="stack">
				{#each levels as level, i}
					{@const aboveDistance = i > active ? i - active : 0}
					<div
						class="layer"
						class:is-below={i < active}
						class:is-active={i === active}
						class:is-above={i > active}
						style="--i: {i}; --above-distance: {aboveDistance}; --from: {level.from}; --to: {level.to}; --shadow: {level.shadow};"
					>
						<div class="face top">
							<span class="top-glyph" aria-hidden="true">{level.glyph}</span>
						</div>
						<div class="face side side-y"></div>
						<div class="face side side-x"></div>
						<div class="face side side-y-back"></div>
						<div class="face side side-x-back"></div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="chip-column" aria-hidden="false">
		{#each levels as level, i}
			<span
				class="chip"
				class:is-active={i === active}
				style="--i: {i}; --shadow: {level.shadow};"
			>
				<span class="chip-bullet" aria-hidden="true">▸</span>
				{level.label}
			</span>
		{/each}
	</div>

</div>

<style>
	.kstack {
		/* All sizing flows from these. Change one and the chips re-align. */
		--cube-size: clamp(200px, 38vw, 280px);
		--z-gap: calc(var(--cube-size) * 0.19);      /* center-to-center distance between layers */
		--rotate-x: 58deg;
		--projection: 0.848;                          /* sin(58deg), cached */
		--layer-gap-y: calc(var(--z-gap) * var(--projection));
		--stack-span: calc((var(--n) - 1) * var(--layer-gap-y));
		--side-thickness: calc(var(--cube-size) * 0.13);
		--chip-gutter: clamp(10px, 2vw, 18px);

		position: relative;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: var(--cube-size) minmax(0, auto);
		column-gap: var(--chip-gutter);
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
	}

	/* ── Cube area ──────────────────────────────────────────────────── */
	.cube-area {
		position: relative;
		flex: 0 0 auto;
		min-width: 0;
		width: var(--cube-size);
		height: var(--cube-size);
		padding-right: calc(var(--cube-size) * 0.02);
		overflow: visible;
		perspective: 1400px;
	}

	.cube {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		transform-style: preserve-3d;
		transform: translateY(calc(var(--cube-size) * -0.8));
		opacity: 0;
	}
	.kstack:not(.phase-drop) .cube {
		transform: translateY(0);
		opacity: 1;
		transition: transform 520ms cubic-bezier(0.22, 1.4, 0.36, 1), opacity 280ms ease-out;
	}

	.stack {
		position: relative;
		width: calc(var(--cube-size) * 0.7);
		height: calc(var(--cube-size) * 0.7);
		transform-style: preserve-3d;
		transform: rotateX(var(--rotate-x)) rotateZ(-42deg);
	}

	/* Layers sit symmetrically around the stack origin so the projected
	   stack is vertically centered on the cube area. */
	.layer {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform: translateZ(0);
		transition: transform 540ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.kstack.phase-dissect .layer,
	.kstack.phase-cycle .layer {
		transform: translateZ(calc((var(--i) - var(--center-idx)) * var(--z-gap)));
		transition-delay: calc(var(--i) * 90ms);
	}

	.face {
		position: absolute;
	}
	.face.side {
		/* Both side strips must render even when their post-rotation normal
		   points away from the camera — otherwise one side culls and looks empty. */
		backface-visibility: visible;
	}

	.face.top {
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		border-radius: 0;
		border: 1.25px dashed color-mix(in srgb, var(--ink) 22%, transparent);
		background: var(--cream, #faf9f5);
		transform: translateZ(calc(var(--side-thickness) * 0.5));
		box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--ink) 5%, transparent);
		transition: background 300ms ease, box-shadow 300ms ease, border 300ms ease;
	}

	.face.bottom {
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		background: var(--cream, #faf9f5);
		transform: translateZ(calc(var(--side-thickness) * -0.5)) rotateX(180deg);
	}

	.face.side {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--ink) 6%, var(--cream, #faf9f5)) 0%,
			color-mix(in srgb, var(--ink) 14%, var(--cream, #faf9f5)) 100%
		);
		transition: background 300ms ease, box-shadow 300ms ease, opacity 300ms ease;
	}

	/* Glyph centered on every top face; only visible when active. */
	.top-glyph {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-family: var(--font-serif, Georgia, serif);
		font-size: calc(var(--cube-size) * 0.18);
		line-height: 1;
		color: var(--shadow);
		opacity: 0;
		transition: opacity 280ms ease;
		pointer-events: none;
	}

	.face.side-y {
		width: 100%;
		height: var(--side-thickness);
		left: 0;
		top: calc(100% - var(--side-thickness) * 0.5);
		transform: rotateX(-90deg);
	}

	.face.side-y-back {
		width: 100%;
		height: var(--side-thickness);
		left: 0;
		top: calc(var(--side-thickness) * -0.5);
		transform: rotateX(90deg);
	}

	.face.side-x {
		width: var(--side-thickness);
		height: 100%;
		left: calc(100% - var(--side-thickness) * 0.5);
		top: 0;
		transform: rotateY(90deg);
	}

	.face.side-x-back {
		width: var(--side-thickness);
		height: 100%;
		left: calc(var(--side-thickness) * -0.5);
		top: 0;
		transform: rotateY(-90deg);
	}

	/* ── Layers BELOW the active: solid filled blocks with drop shadow ── */
	.layer.is-below .face.top {
		background: var(--cream, #faf9f5);
		border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
		box-shadow:
			0 6px 14px -8px rgba(0, 0, 0, 0.18),
			inset 0 0 0 0.5px color-mix(in srgb, var(--ink) 8%, transparent);
	}
	.layer.is-below .face.side {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--ink) 5%, var(--cream, #faf9f5)) 0%,
			color-mix(in srgb, var(--ink) 12%, var(--cream, #faf9f5)) 100%
		);
	}

	/* ── Layers ABOVE the active: ghost dashed outlines, fading up ─── */
	.layer.is-above {
		opacity: calc(1 - var(--above-distance) * 0.18);
	}
	.layer.is-above .face.top {
		background: transparent;
		border: 1.25px dashed color-mix(in srgb, var(--ink) 22%, transparent);
		box-shadow: none;
	}
	.layer.is-above .face.side {
		background: transparent;
		opacity: 0.3;
	}

	/* ── Active layer: glow side + shimmer + Z lift + scale pop ─────── */
	.layer.is-active .face.side {
		background:
			linear-gradient(
				115deg,
				transparent 28%,
				rgba(255, 255, 255, 0.55) 48%,
				rgba(255, 255, 255, 0.55) 52%,
				transparent 72%
			) 200% 0 / 280% 100% no-repeat,
			linear-gradient(135deg, var(--from) 0%, var(--to) 100%);
		box-shadow: 0 0 22px color-mix(in srgb, var(--shadow) 60%, transparent);
		animation: shimmer 2.4s ease-in-out infinite;
	}
	.layer.is-active .face.top {
		background: linear-gradient(135deg, var(--from) 0%, var(--to) 100%);
		border-color: color-mix(in srgb, var(--shadow) 50%, transparent);
		box-shadow:
			inset 0 0 0 0.5px color-mix(in srgb, var(--shadow) 30%, transparent),
			0 22px 50px -22px color-mix(in srgb, var(--shadow) 70%, transparent);
	}
	.layer.is-active .top-glyph {
		opacity: 0.85;
		color: var(--cream, #faf9f5);
	}

	.kstack.phase-cycle .layer.is-active {
		transform:
			translateZ(calc((var(--i) - var(--center-idx)) * var(--z-gap) + 8px))
			scale(1.014);
	}

	@keyframes shimmer {
		to { background-position: -100% 0, 0 0; }
	}

	/* ── Chip column ────────────────────────────────────────────────── */
	/* Height equals the projected stack span, so chips placed at
	   top: (n-1-i) * layer-gap-y line up exactly with their layers. */
	.chip-column {
		position: relative;
		height: var(--stack-span);
		width: clamp(11ch, 16ch, 18ch);
		align-self: center;
	}

	.chip {
		position: absolute;
		left: 0;
		width: 100%;
		top: calc((var(--n) - 1 - var(--i)) * var(--layer-gap-y));
		transform: translate(6px, -50%);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		font-size: clamp(9px, 1.3vw, 11px);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-muted);
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 999px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 220ms ease, transform 220ms ease, color 220ms ease,
			background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
	}

	/* Leader line from chip to cube (replaces the SVG connector). */
	.chip::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		width: var(--chip-gutter);
		height: 1px;
		background: repeating-linear-gradient(
			to right,
			color-mix(in srgb, var(--ink) 22%, transparent) 0 2px,
			transparent 2px 6px
		);
		transform: translateY(-0.5px);
		opacity: 0.55;
		transition: opacity 240ms ease, background 240ms ease;
	}

	.kstack:not(.phase-drop) .chip {
		opacity: 1;
		transform: translate(0, -50%);
		transition-delay: calc((var(--n) - 1 - var(--i)) * 70ms + 200ms);
	}

	.chip-bullet { font-size: 9px; opacity: 0.55; }

	.chip.is-active {
		color: var(--fg-on-accent, #fff);
		background: var(--ink);
		border-color: var(--shadow);
		box-shadow: var(--shadow-sm), 0 0 0 2px color-mix(in srgb, var(--shadow) 35%, transparent);
		transition-delay: 0ms;
	}
	.chip.is-active .chip-bullet { color: var(--shadow); opacity: 1; }
	.chip.is-active::before {
		background: repeating-linear-gradient(
			to right,
			var(--shadow) 0 4px,
			transparent 4px 10px
		);
		background-size: 14px 100%;
		opacity: 1;
		animation: march 0.7s linear infinite;
	}
	@keyframes march {
		to { background-position: -14px 0; }
	}

	/* ── Narrow viewport fallback: chip column drops below the cube ─── */
	@media (max-width: 340px) {
		.kstack {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;
			row-gap: 16px;
			justify-items: center;
		}
		.chip-column {
			width: 100%;
			max-width: 240px;
			height: auto;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.chip {
			position: static;
			width: 100%;
			transform: none;
		}
		.kstack:not(.phase-drop) .chip { transform: none; }
		.chip::before { display: none; }
	}

	/* ── Reduced motion ─────────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.cube { transform: translateY(0); opacity: 1; transition: none; }
		.layer {
			transform: translateZ(calc((var(--i) - var(--center-idx)) * var(--z-gap)));
			transition: none;
		}
		.chip { opacity: 1; transform: translate(0, -50%); transition: none; }
		.layer.is-active .face.side { animation: none; }
		.kstack.phase-cycle .layer.is-active {
			transform: translateZ(calc((var(--i) - var(--center-idx)) * var(--z-gap)));
		}
		.chip.is-active::before { animation: none; }
	}
</style>
