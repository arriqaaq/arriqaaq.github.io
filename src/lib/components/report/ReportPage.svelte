<script lang="ts">
	import 'swiper/css';
	import 'swiper/css/effect-coverflow';
	import 'swiper/css/free-mode';

	import type { Report, ReportCard, ReportChapter } from '$lib/types';
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import ReportStepper from './ReportStepper.svelte';
	import ReportSlide from './ReportSlide.svelte';

	type Props = { report: Report; close?: () => void; inline?: boolean };
	let { report, close, inline = false }: Props = $props();

	type FlatSlide = {
		card: ReportCard;
		chapter: ReportChapter;
		index: number;
	};

	const flatSlides = $derived<FlatSlide[]>(
		report.chapters.flatMap((chapter, ci) =>
			chapter.cards.map((card, k) => ({
				card,
				chapter,
				index: ci * 1000 + k
			}))
		)
	);

	let activeChapterId = $state('');
	$effect(() => {
		if (!activeChapterId) {
			const first = report.chapters.find((c) => c.show_in_stepper) ?? report.chapters[0];
			if (first) activeChapterId = first.id;
		}
	});
	let pageEl = $state<HTMLElement | null>(null);
	let swiperEl = $state<HTMLElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let swiper: any = null;

	type GroupRange = { start: number; end: number };
	let groupsById = new Map<string, GroupRange>();
	let groupOrder: string[] = [];
	let groupIdBySlideIndex: string[] = [];
	let progressByChapter = $state<Record<string, number>>({});

	function applyChapterVisuals(id: string) {
		const ch = report.chapters.find((c) => c.id === id);
		if (!ch || !pageEl) return;
		const root = pageEl.closest<HTMLElement>(
			'.report-inline, .report-overlay-panel, .report-standalone'
		);
		if (root) {
			root.style.setProperty('--page-bg', ch.bg);
			root.classList.toggle('u-theme-light', ch.theme === 'light');
			root.classList.toggle('u-theme-dark', ch.theme === 'dark');
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function buildGroups(s: any) {
		groupsById = new Map();
		groupOrder = [];
		groupIdBySlideIndex = new Array(s.slides.length);
		let currentId: string | null = null;
		for (let i = 0; i < s.slides.length; i++) {
			const slide = s.slides[i] as HTMLElement;
			const hash = slide.getAttribute('data-hash');
			if (hash) {
				if (currentId !== null && groupsById.has(currentId)) {
					groupsById.get(currentId)!.end = i - 1;
				}
				currentId = hash;
				groupsById.set(currentId, { start: i, end: s.slides.length - 1 });
				groupOrder.push(currentId);
			}
			groupIdBySlideIndex[i] = currentId ?? '';
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function activeGroupId(s: any): string {
		return groupIdBySlideIndex[s.activeIndex ?? 0] ?? '';
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function recomputeProgress(s: any) {
		const idx = s.activeIndex ?? 0;
		const next: Record<string, number> = {};
		for (const [id, range] of groupsById.entries()) {
			if (idx < range.start) next[id] = 0;
			else if (idx >= range.end) next[id] = 1;
			else {
				const span = Math.max(1, range.end - range.start);
				next[id] = Math.min(1, Math.max(0, (idx - range.start) / span));
			}
		}
		progressByChapter = next;
	}

	function jumpToChapter(id: string) {
		if (swiper && groupsById.has(id)) {
			swiper.slideTo(groupsById.get(id)!.start, 600);
			return;
		}
		// Pre-Swiper fallback: scroll the chapter section into view (vertical mode).
		const el = swiperEl?.querySelector<HTMLElement>(
			`[data-section="${id}"]`
		);
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		activeChapterId = id;
		applyChapterVisuals(id);
	}

	onMount(() => {
		if (!browser || !swiperEl) return;

		applyChapterVisuals(activeChapterId);

		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

		let cleanup = () => {};

		(async () => {
			const SwiperMod = await import('swiper');
			const ModulesMod = await import('swiper/modules');
			const Swiper = (SwiperMod as { default: unknown }).default as new (
				el: HTMLElement,
				opts: unknown
			) => unknown;
			const { EffectCoverflow, FreeMode, Mousewheel, Keyboard, A11y } = ModulesMod;

			swiper = new Swiper(swiperEl as HTMLElement, {
				modules: [EffectCoverflow, FreeMode, Mousewheel, Keyboard, A11y],
				slidesPerView: 'auto',
				centeredSlides: true,
				autoHeight: false,
				direction: 'horizontal',
				speed: 600,
				effect: reduced ? 'slide' : 'coverflow',
				resistanceRatio: 0.5,
				slideToClickedSlide: false,
				grabCursor: true,
				threshold: 20,
				longSwipesRatio: 0.25,
				longSwipesMs: 300,
				preventClicksPropagation: true,
				// Swipe is detected anywhere inside the swiper container (including the
				// empty bg around the centered card), not just on the slide itself.
				touchEventsTarget: 'container',
				touchStartPreventDefault: false,
				coverflowEffect: {
					modifier: 1.5,
					rotate: -18,
					scale: 0.8,
					slideShadows: false,
					stretch: '-20%'
				},
				mousewheel: { enabled: !inline },
				keyboard: { enabled: true, onlyInViewport: inline },
				breakpoints: {
					0: {
						speed: 300,
						freeMode: { enabled: false },
						coverflowEffect: {
							rotate: -10,
							scale: 0.85,
							modifier: 1.5,
							stretch: '5%'
						}
					},
					600: {
						freeMode: {
							enabled: true,
							sticky: true,
							momentum: true,
							momentumRatio: 1,
							momentumVelocityRatio: 0.8,
							momentumBounce: true,
							momentumBounceRatio: 0.25
						}
					},
					900: {
						coverflowEffect: {
							rotate: -18,
							scale: 0.8,
							modifier: 1.5,
							stretch: '-20%'
						}
					}
				},
				slideActiveClass: 'is-active',
				on: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					init(s: any) {
						buildGroups(s);
						if (!inline) {
							const initialHash = (location.hash || '').replace('#', '').trim();
							if (initialHash && groupsById.has(initialHash)) {
								s.slideTo(groupsById.get(initialHash)!.start, 0, false);
							}
						}
						const id = activeGroupId(s);
						if (id) {
							activeChapterId = id;
							applyChapterVisuals(id);
						}
						recomputeProgress(s);
						swiperEl?.classList.add('is-ready');
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					resize(s: any) {
						buildGroups(s);
						recomputeProgress(s);
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					slideChange(s: any) {
						const id = activeGroupId(s);
						if (id && id !== activeChapterId) {
							activeChapterId = id;
							applyChapterVisuals(id);
							if (!inline) {
								const base = location.href.split('#')[0];
								history.replaceState(null, '', `${base}#${id}`);
							}
						}
						recomputeProgress(s);
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					setTransition(s: any) {
						s.wrapperEl.style.transitionTimingFunction =
							'cubic-bezier(0.25, 1.25, 0.5, 1)';
					}
				}
			});

			cleanup = () => {
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(swiper as any)?.destroy(true, true);
				} catch {
					// ignore
				}
				swiper = null;
			};
		})();

		return () => {
			cleanup();
			// strip theme classes when unmounting
			const root = pageEl?.closest<HTMLElement>(
				'.report-inline, .report-overlay-panel, .report-standalone'
			);
			if (root) {
				root.style.removeProperty('--page-bg');
				root.classList.remove('u-theme-light', 'u-theme-dark');
			}
		};
	});

	// Avoid spurious effects re-running for prop reads inside callbacks.
	$effect(() => {
		untrack(() => {
			void flatSlides;
		});
	});
</script>

<section class="report" aria-label={report.title} bind:this={pageEl}>
	<ReportStepper
		chapters={report.chapters}
		{activeChapterId}
		{progressByChapter}
		onJump={jumpToChapter}
	/>

	<div class="report-swiper" bind:this={swiperEl}>
		<div class="swiper-wrapper">
			{#each flatSlides as slide, i (i)}
				<div
					class="swiper-slide"
					data-section={slide.chapter.id}
					data-hash={slide.card.hash ?? null}
					data-bg={slide.card.bg}
					data-theme={slide.card.theme}
					role="group"
					aria-label={`${i + 1} / ${flatSlides.length}`}
				>
					<ReportSlide card={slide.card} chapter={slide.chapter} />
				</div>
			{/each}
		</div>
	</div>

	{#if close}
		<button class="report-back" type="button" onclick={close}>← Close</button>
	{/if}
</section>
