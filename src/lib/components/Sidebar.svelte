<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { settings } from '$lib/content';
	import Icon from './Icon.svelte';

	function iconFor(label: string): string {
		const map: Record<string, string> = {
			Home: 'home',
			Writing: 'pen',
			Blog: 'pen',
			Magazine: 'book',
			About: 'user',
			Projects: 'folder',
			Talks: 'mic',
			Newsletter: 'mail',
			Tags: 'tag',
			Search: 'search',
			GitHub: 'github',
			Tech: 'code',
			X: 'x',
			Twitter: 'x',
			Email: 'mail',
			Instagram: 'instagram',
			WhatsApp: 'whatsapp',
			Health: 'heart',
			Courses: 'graduation-cap',
			'Coding Bootcamp': 'code',
			'Letters From The Soul': 'feather',
			Contact: 'mail',
			'Data & privacy': 'shield'
		};
		return map[label] ?? 'chevron';
	}

	function isExternal(url: string): boolean {
		return /^https?:\/\//.test(url);
	}

	function rebase(url: string): string {
		if (isExternal(url)) return url;
		return base + url;
	}

	function isActive(url: string): boolean {
		if (isExternal(url)) return false;
		const path = page.url.pathname;
		const target = base + url;
		if (target === base + '/' || target === base) return path === base + '/' || path === base;
		return path === target || path.startsWith(target + (target.endsWith('/') ? '' : '/'));
	}
</script>

<nav class="rail" aria-label="Primary">
	<a href={base + '/'} class="rail-logo" title={settings.title}>A</a>
	<div class="rail-group">
		{#each settings.navigation as item}
			<a
				href={rebase(item.url)}
				class="rail-btn"
				class:active={isActive(item.url)}
				class:rail-btn--desktop-only={!item.mobile}
				title={item.label}
				aria-label={item.label}
				target={isExternal(item.url) ? '_blank' : undefined}
				rel={isExternal(item.url) ? 'noreferrer' : undefined}
			>
				<Icon name={iconFor(item.label)} />
			</a>
		{/each}
	</div>
	<div class="rail-group rail-group--bottom">
		{#each settings.secondary_navigation as item}
			<a
				href={rebase(item.url)}
				class="rail-btn"
				class:rail-btn--desktop-only={!item.mobile}
				title={item.label}
				aria-label={item.label}
				target={isExternal(item.url) ? '_blank' : undefined}
				rel={isExternal(item.url) ? 'noreferrer' : undefined}
			>
				<Icon name={iconFor(item.label)} />
			</a>
		{/each}
	</div>
</nav>
