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

        if ($user && !['teacher', 'admin', 'sudo'].includes($user.roles)) {
            goto('/');
            return;
        }

        isLoading = false;
    });
</script>

<div class="flex flex-1 h-full">
    <div class="flex-1 w-full">
        {@render children()}
    </div>
</div>
