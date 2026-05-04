<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { settings, tags, authors, pages } from '$lib/content';

	const visibleAuthors = authors.filter((a) => a.slug !== 'ghost');
	// Filter out report-system tags (e.g. report-af-2026-ch1) from the global topic list.
	const visibleTags = tags.filter((t) => !t.slug.startsWith('report-'));

	function isActive(url: string): boolean {
		const path = page.url.pathname;
		return path === base + url;
	}
</script>

<aside class="tag-panel" aria-label="Topics">
	<a href={base + '/'} class="tag-panel-title">{settings.title}</a>
	{#if settings.description}
		<p class="tag-panel-desc">{settings.description}</p>
	{/if}

	<small class="tag-panel-heading">Tags</small>
	<ul class="tag-list">
		{#each visibleTags as t}
			<li>
				<a
					href={`${base}/tag/${t.slug}/`}
					class="tag-row"
					class:is-active={isActive(`/tag/${t.slug}/`)}
				>
					<span class="tag-name">{t.name}</span>
					<span class="tag-count">{t.post_count}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if visibleAuthors.length > 1}
		<small class="tag-panel-heading">Authors</small>
		<ul class="tag-list">
			{#each visibleAuthors as a}
				<li>
					<a
						href={`${base}/author/${a.slug}/`}
						class="tag-row"
						class:is-active={isActive(`/author/${a.slug}/`)}
					>
						<span class="tag-name">{a.name}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if pages.length > 0}
		<details class="tag-panel-section">
			<summary class="tag-panel-heading tag-panel-heading--toggle">
				<span>Pages</span>
				<span class="tag-count">{pages.length}</span>
			</summary>
			<ul class="tag-list">
				{#each pages as pg}
					<li>
						<a
							href={`${base}/${pg.slug}/`}
							class="tag-row"
							class:is-active={isActive(`/${pg.slug}/`)}
						>
							<span class="tag-name">{pg.title}</span>
						</a>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</aside>
