<script lang="ts">
	import type { ReportChapter } from '$lib/types';
	import { onMount, tick } from 'svelte';
	import ReportProgressRing from './ReportProgressRing.svelte';

	type Props = {
		chapters: ReportChapter[];
		activeChapterId: string;
		progressByChapter?: Record<string, number>;
		onJump?: (chapterId: string) => void;
	};
	let {
		chapters,
		activeChapterId,
		progressByChapter = {},
		onJump
	}: Props = $props();

	const visible = $derived(chapters.filter((c) => c.show_in_stepper));

	let stepperEl = $state<HTMLElement | null>(null);
	let bulletX = $state(0);
	let bulletW = $state(56);

	async function measureBullet() {
		if (!stepperEl) return;
		await tick();
		const btn = stepperEl.querySelector<HTMLElement>(
			`[data-group="${activeChapterId}"]`
		);
		if (!btn) return;
		bulletX = btn.offsetLeft;
		bulletW = btn.offsetWidth;
		// Mobile: keep active chip centered in the scroll-snap strip.
		if (window.matchMedia('(max-width: 899px)').matches) {
			btn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
		}
	}

	$effect(() => {
		// Re-measure when active chapter changes.
		void activeChapterId;
		measureBullet();
	});

	onMount(() => {
		measureBullet();
		const ro = new ResizeObserver(() => measureBullet());
		if (stepperEl) ro.observe(stepperEl);
		const onResize = () => measureBullet();
		window.addEventListener('resize', onResize);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', onResize);
		};
	});

	function onClick(e: MouseEvent, chapterId: string) {
		if (!onJump) return;
		e.preventDefault();
		onJump(chapterId);
	}
</script>

<nav class="report-stepper" bind:this={stepperEl} aria-label="Report chapters">
	<span
		class="bullet"
		style:--bullet-x="{bulletX}px"
		style:--bullet-w="{bulletW}px"
		aria-hidden="true"
	></span>
	{#each visible as ch (ch.id)}
		<a
			data-group={ch.id}
			href="#{ch.id}"
			onclick={(e) => onClick(e, ch.id)}
			class:is-active={activeChapterId === ch.id}
			aria-current={activeChapterId === ch.id ? 'true' : undefined}
		>
			<span class="nav-icon">
				{#if ch.nav_icon}
					<img src={ch.nav_icon} alt="" />
				{:else}
					<span class="nav-glyph" aria-hidden="true">
						{ch.nav_index ?? ch.nav_label.slice(0, 1)}
					</span>
				{/if}
				<ReportProgressRing progress={progressByChapter[ch.id] ?? 0} />
			</span>
			<span class="label">{ch.nav_label}</span>
		</a>
	{/each}
</nav>

<style>
	.nav-icon {
		position: relative;
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.nav-glyph {
		width: 100%;
		height: 100%;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.10);
		font-family: var(--font-headline, 'Tiempos Headline', Georgia, serif);
		font-weight: 600;
		font-size: 18px;
		letter-spacing: -0.01em;
		color: inherit;
	}
	:global(.u-theme-light) .nav-glyph {
		background: rgba(0, 0, 0, 0.06);
		color: var(--ink, #1a1a1a);
	}
	@media (min-width: 900px) {
		.nav-icon {
			width: 44px;
			height: 44px;
		}
		.nav-glyph {
			font-size: 22px;
		}
	}
</style>
