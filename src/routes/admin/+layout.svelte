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
        

        // Verifica permissão de sudo (ou admin, dependendo da sua regra de negócio)
        // Aqui assumindo que o store 'user' já tem os dados após checkAuth
        // Se a role não for 'sudo', redireciona
        // Adapte conforme a propriedade de roles do seu user store
        
        if ($user && !['admin', 'sudo'].includes($user.roles)) {
            goto('/');
            return;
        }
        
       
        isLoading = false;
    });
</script>

{#if isLoading}
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
{:else}
    <div class="min-h-screen bg-gray-50">
        {@render children()}
    </div>
{/if}
