<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Report } from '$lib/types';
	import ReportPage from './ReportPage.svelte';

	type Props = { report: Report };
	let { report }: Props = $props();

	function close() {
		if (typeof history !== 'undefined' && history.state?.reportSlug) {
			history.back();
		} else {
			goto('/');
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			close();
		}
	}

	onMount(() => {
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', onKey, true);
		return () => {
			document.removeEventListener('keydown', onKey, true);
			document.body.style.overflow = prevOverflow;
			document.body.classList.remove('u-theme-dark', 'u-theme-light');
		};
	});
</script>

<div
	class="report-overlay"
	role="dialog"
	aria-modal="true"
	aria-label={report.title}
>
	<button
		class="report-overlay-backdrop"
		type="button"
		aria-label="Close report"
		onclick={close}
	></button>
	<div class="report-overlay-panel">
		<button
			class="report-overlay-close"
			type="button"
			aria-label="Close"
			onclick={close}
		>×</button>
		<ReportPage {report} {close} />
	</div>
</div>
