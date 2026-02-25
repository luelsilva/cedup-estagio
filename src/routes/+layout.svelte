<script lang="ts">
	import './layout.css';

	import { onMount } from 'svelte';
	import { checkAuth } from '$lib/api';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import DevNotes from '$lib/components/DevNotes.svelte';

	let { children } = $props();

	onMount(() => {
		checkAuth();
		// Remove o loader inicial se ele ainda existir
		const loader = document.getElementById('initial-loader');
		if (loader) {
			loader.style.opacity = '0';
			setTimeout(() => loader.remove(), 300);
		}
	});
</script>

<div class="flex min-h-screen w-full flex-col bg-gray-50">
	<Header />
	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>
	<Footer />
</div>

<DevNotes />
