<script lang="ts">
	import { settings } from '$lib/content';
	import Icon from './Icon.svelte';

	function iconFor(label: string): string {
		if (label === 'GitHub') return 'github';
		if (label === 'X' || label === 'Twitter') return 'x';
		if (label === 'Email' || label === 'Newsletter') return 'mail';
		return 'chevron';
	}

	const year = new Date().getFullYear();
</script>

<footer class="footer theme--tajweed">
	<div class="footer-row">
		<span class="footer-meta">© {year} {settings.title}</span>
		<div class="footer-social">
			{#each settings.secondary_navigation as item}
				<a
					href={item.url}
					aria-label={item.label}
					target={/^https?:\/\//.test(item.url) ? '_blank' : undefined}
					rel={/^https?:\/\//.test(item.url) ? 'noreferrer' : undefined}
				>
					<Icon name={iconFor(item.label)} />
				</a>
			{/each}
		</div>
	</div>
</footer>
