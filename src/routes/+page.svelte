<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const returnTo = localStorage.getItem('returnTo');
		if (returnTo) {
			localStorage.removeItem('returnTo');
			goto(returnTo);
		}
	});
</script>

<!-- Hero Section with Image -->
<div class="relative w-full flex-1 overflow-hidden">
	<img src="/cedup-fachada.jpg" alt="Fachada do Cedup" class="h-full w-full object-cover" />
	<!-- Overlay -->
	<div class="absolute inset-0 bg-black/20"></div>
</div>
