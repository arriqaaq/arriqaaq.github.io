<script lang="ts">
	import { onMount } from 'svelte';

	let pct = $state(0);

	onMount(() => {
		function update() {
			const max = document.body.scrollHeight - window.innerHeight;
			pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / max) * 100));
		}
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});
</script>

<div class="reading-progress" aria-hidden="true" style="width: {pct}%"></div>
