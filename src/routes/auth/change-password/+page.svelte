<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import ChangePasswordForm from '$lib/components/auth/ChangePasswordForm.svelte';

	// Se o usuário não estiver logado, redireciona para login
	onMount(() => {
		const unsubscribe = user.subscribe((u) => {
			if (!u) {
				goto('/auth/login');
			}
		});
		return unsubscribe;
	});
</script>

<div class="flex min-h-[80vh] w-full flex-1 items-center justify-center bg-gray-50 px-4 py-12">
	<ChangePasswordForm />
</div>
