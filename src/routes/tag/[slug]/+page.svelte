<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { settings } from '$lib/content';
	import { themeClass } from '$lib/themeForTag';
	let { data } = $props();
</script>

<style>
	.report-backlinks {
		margin: 48px 0 16px;
		padding: 24px 0;
		border-top: 1px solid var(--line);
	}
	.report-backlinks-list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.report-backlink {
		display: inline-flex;
		align-items: baseline;
		gap: 10px;
		padding: 10px 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface-alt);
		color: var(--ink);
		text-decoration: none;
		transition: border-color 160ms ease, background 160ms ease;
	}
	.report-backlink:hover {
		border-color: var(--ink);
		background: var(--surface);
	}
	.report-backlink-title {
		font-family: var(--font-headline, Georgia, serif);
		font-weight: 600;
		font-size: 16px;
		letter-spacing: -0.01em;
	}
	.report-backlink-chapter {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ink-muted);
	}
</style>

<svelte:head>
	<title>{data.tag.name} — {settings.title}</title>
	{#if data.tag.description}<meta name="description" content={data.tag.description} />{/if}
</svelte:head>

<div class={themeClass(data.tag.slug)}>
	<header class="archive-header">
		<small class="related-heading">Tag</small>
		<h1 class="archive-title">{data.tag.name}</h1>
		{#if data.tag.description}
			<p class="archive-desc">{data.tag.description}</p>
		{/if}
		<p class="archive-count">{data.posts.length} post{data.posts.length === 1 ? '' : 's'}</p>
	</header>

	<div class="feed">
		{#each data.posts as p}
			<PostCard post={p} />
		{/each}
	</div>
</div>

{#if data.featuredInReports.length > 0}
	<section class="report-backlinks">
		<small class="related-heading">Featured in reports</small>
		<ul class="report-backlinks-list">
			{#each data.featuredInReports as ref}
				{#each ref.chapterIds as chapterId}
					{@const chapter = ref.report.chapters.find((c) => c.id === chapterId)}
					{#if chapter}
						<li>
							<a
								href={`/report/${ref.report.slug}/#${chapterId}`}
								class="report-backlink"
							>
								<span class="report-backlink-title">{ref.report.title}</span>
								<span class="report-backlink-chapter">{chapter.title}</span>
							</a>
						</li>
					{/if}
				{/each}
			{/each}
		</ul>
	</section>
{/if}
