<script lang="ts">
	import { base } from '$app/paths';
	import { resolveImage } from '$lib/content';
	import type { Post } from '$lib/types';

	type Props = { post: Post };
	let { post }: Props = $props();

	const featureImg = $derived(resolveImage(post.feature_image, base));
	const excerpt = $derived(post.custom_excerpt ?? post.plaintext.slice(0, 160) + '…');
</script>

<section class="featured-hero">
	<a class="featured-hero-card" href={`${base}/${post.slug}/`}>
		<div class="featured-hero-text">
			<h1 class="featured-hero-title">{post.title}</h1>
			<p class="featured-hero-excerpt">{excerpt}</p>
			<span class="featured-hero-cta">Continue reading <span aria-hidden="true">→</span></span>
		</div>
		{#if featureImg}
			<div class="featured-hero-image">
				<img src={featureImg} alt={post.title} loading="eager" />
			</div>
		{/if}
	</a>
</section>
