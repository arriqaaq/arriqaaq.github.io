<script lang="ts">
	import { goto } from '$app/navigation';
	import ReportPage from '$lib/components/report/ReportPage.svelte';
	let { data } = $props();
	function close() {
		goto('/');
	}
</script>

<svelte:head>
	<title>{data.report.title}</title>
	{#if data.report.subtitle}
		<meta name="description" content={data.report.subtitle} />
	{/if}
</svelte:head>

<ReportPage report={data.report} {close} />
