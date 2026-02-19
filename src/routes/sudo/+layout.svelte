<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { checkAuth } from '$lib/api';

	let { children } = $props();
	let isLoading = $state(true);

	onMount(async () => {
		const isAuthenticated = await checkAuth();

		if (!isAuthenticated) {
			goto('/auth/login');
			return;
		}

		// Only SUDO allowed
		if ($user && $user.roles !== 'sudo') {
			goto('/');
			return;
		}

		isLoading = false;
	});
</script>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center bg-gray-900">
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
			<p class="animate-pulse font-medium text-orange-500">Verificando credenciais sudo...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-950 text-gray-100">
		{@render children()}
	</div>
{/if}
