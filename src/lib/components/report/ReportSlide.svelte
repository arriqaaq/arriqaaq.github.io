<script lang="ts">
	import type { ReportCard, ReportChapter } from '$lib/types';
	import { getTagById } from '$lib/content';
	import { goto } from '$app/navigation';

	type Props = { card: ReportCard; chapter: ReportChapter };
	let { card, chapter }: Props = $props();

	const isCover = $derived(card.kind === 'cover');

	// Hide system report-* tags from chip rendering; user-facing tags only.
	const visibleTags = $derived(
		card.post
			? card.post.tags
					.map((id) => getTagById(id))
					.filter(
						(t): t is NonNullable<typeof t> => !!t && !t.slug.startsWith('report-')
					)
					.slice(0, 3)
			: []
	);

	const primaryTagName = $derived(
		card.post?.primary_tag ? (getTagById(card.post.primary_tag)?.name ?? null) : null
	);

	function onCardClick(e: MouseEvent) {
		if (!card.permalink) return;
		// Let modifier-clicks open in new tab natively.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (e.button !== 0) return;
		// If we're inside a shallow-routing overlay, close it before navigating
		// so the user lands on the article itself, not behind a dialog.
		if (typeof history !== 'undefined' && history.state?.reportSlug) {
			e.preventDefault();
			const href = card.permalink;
			history.back();
			// Wait one tick for the overlay to unmount before navigating.
			setTimeout(() => goto(href), 0);
		}
	}
</script>

{#if isCover}
	<article
		class="report-card report-card--cover"
		data-kind="cover"
		style:--card-bg={card.bg}
		style:--card-rotation="{card.rotation}deg"
	>
		{#if card.eyebrow}
			<p class="report-card-eyebrow">{card.eyebrow}</p>
		{/if}
		<h2 class="report-card-cover-title">{card.title ?? chapter.title}</h2>
		{#if card.excerpt}
			<p class="report-card-cover-subtitle">{card.excerpt}</p>
		{/if}
		{#if chapter.id === 'intro'}
			<p class="report-scroll-hint" aria-hidden="true">
				<span>Swipe or pick a chapter</span>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 12h14"/>
					<path d="M13 5l7 7-7 7"/>
				</svg>
			</p>
		{/if}
	</article>
{:else}
	<a
		class="report-card report-card--post"
		href={card.permalink ?? '#'}
		data-kind="post"
		data-sveltekit-preload-data="hover"
		style:--card-rotation="{card.rotation}deg"
		onclick={onCardClick}
	>
		{#if card.feature_image}
			<figure class="report-card-figure">
				<img src={card.feature_image} alt="" loading="lazy" />
			</figure>
		{:else}
			<div class="report-card-figure report-card-figure--empty" aria-hidden="true"></div>
		{/if}
		<div class="report-card-text">
			{#if primaryTagName}
				<p class="report-card-eyebrow">{primaryTagName}</p>
			{/if}
			<h3 class="report-card-title">{card.title}</h3>
			{#if card.excerpt}
				<p class="report-card-excerpt">{card.excerpt}</p>
			{/if}
			{#if visibleTags.length > 0}
				<ul class="report-card-tags" aria-label="Tags">
					{#each visibleTags as t (t.id)}
						<li>
							<span class="report-card-tag">{t.name}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</a>
{/if}
