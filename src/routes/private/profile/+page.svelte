<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    import { checkAuth } from '$lib/api';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let isLoading = $state(true);

    onMount(async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            goto('/auth/login');
            return;
        }
        isLoading = false;
    });

    function getInitials(name: string) {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }
</script>

<svelte:head>
    <title>Meu Perfil | CEDUP</title>
</svelte:head>

<div class="container mx-auto px-6 py-12 max-w-4xl" in:fade>
    {#if isLoading}
        <div class="flex items-center justify-center h-64">
            <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    {:else if $user}
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <!-- Header/Cover -->
            <div class="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            
            <div class="px-8 pb-10">
                <!-- Profile Avatar -->
                <div class="relative -mt-16 mb-6">
                    <div class="inline-flex h-32 w-32 items-center justify-center rounded-3xl bg-white p-2 shadow-xl">
                        <div class="flex h-full w-full items-center justify-center rounded-2xl bg-blue-50 text-3xl font-black text-blue-600">
                            {getInitials($user.name || '')}
                        </div>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div class="space-y-1">
                        <h1 class="text-3xl font-black text-gray-900 tracking-tight">{$user.name}</h1>
                        <p class="text-gray-500 font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {$user.email}
                        </p>
                    </div>

                    <div class="flex gap-3">
                        <a 
                            href="/auth/change-password" 
                            class="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            Alterar Senha
                        </a>
                    </div>
                </div>

                <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-50">
                    <div class="space-y-4">
                        <h2 class="text-xs font-black uppercase tracking-widest text-gray-400">Informações da Conta</h2>
                        <div class="space-y-4">
                            <div class="flex flex-col bg-gray-50/50 p-4 rounded-2xl">
                                <span class="text-xs font-bold text-gray-500 uppercase tracking-tighter">Nível de Acesso</span>
                                <div class="mt-1 flex items-center gap-2">
                                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-blue-700 uppercase">
                                        {$user.roles || 'Aluno'}
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-col bg-gray-50/50 p-4 rounded-2xl">
                                <span class="text-xs font-bold text-gray-500 uppercase tracking-tighter">Status</span>
                                <div class="mt-1 flex items-center gap-2">
                                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span class="text-sm font-bold text-gray-900">Verificado</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h2 class="text-xs font-black uppercase tracking-widest text-gray-400">Suporte</h2>
                        <div class="rounded-2xl border border-dashed border-gray-200 p-6">
                            <p class="text-sm text-gray-500 leading-relaxed font-medium">
                                Se houver algum erro em seus dados cadastrais, por favor entre em contato com a secretaria do CEDUP para atualização no banco de dados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
