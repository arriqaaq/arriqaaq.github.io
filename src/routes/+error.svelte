<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { settings } from '$lib/content';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title={`Error — ${settings.title}`} />

<section class="error-page">
	<small class="related-heading">Error {page.status}</small>
	<h1 class="archive-title">{page.error?.message || 'Something went wrong'}</h1>
	<p><a href={`${base}/`} class="btn btn--primary">Back home</a></p>
</section>

<style>
	.error-page {
		text-align: center;
		padding: 80px 0;
	}
</style>
