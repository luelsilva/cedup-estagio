<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkAuth } from '$lib/api';
    import { menuStore } from '$lib/stores/menuStore';
    import { fly, fade } from 'svelte/transition';

    const { isLoading } = menuStore;

    onMount(async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            goto('/auth/login');
            return;
        }

        // Inicializa o store (que cuida do cache e atualização)
        menuStore.init();
    });
</script>

<svelte:head>
    <title>Painel de Estágio | Cedup</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6 md:p-10">
    {#if $isLoading && $menuStore.length === 0}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[1200px] mx-auto">
            {#each Array(4) as _}
                <div class="bg-white rounded-3xl h-64 animate-pulse border border-gray-100 shadow-sm"></div>
            {/each}
        </div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[1200px] mx-auto">
            {#each $menuStore as section, i (section.code)}
                <div 
                    in:fly={{ y: 20, duration: 400, delay: i * 50 }}
                    class="flex flex-col rounded-3xl border border-gray-100 shadow-xl overflow-hidden transition-all duration-300"
                    style="background-color: {section.colorLight};"
                >
                    <!-- Header do Card -->
                    <div 
                        class="px-6 py-5 border-b border-white/20 flex items-center justify-between"
                        style="background-color: {section.colorDark};"
                    >
                        <h2 class="text-lg font-black text-white leading-tight">
                            {section.code} - {section.caption}
                        </h2>
                    </div>

                    <!-- Lista de Itens -->
                    <div class="flex-1 p-4 space-y-2">
                        {#if section.items.length === 0}
                            <div class="py-10 text-center">
                                <p class="text-gray-400 text-sm font-medium italic">Nenhum item ativo</p>
                            </div>
                        {:else}
                            {#each section.items as item (item.model)}
                                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                                <div 
                                    in:fade={{ duration: 300 }}
                                    class="group p-3 rounded-xl transition-all duration-200 flex items-center justify-between"
                                    style="cursor: {item.link ? 'pointer' : 'default'}; color: {section.colorDark};"
                                    class:bg-white={item.link}
                                    class:shadow-sm={item.link}
                                    class:hover:shadow-md={item.link}
                                    onclick={() => item.link && window.open(item.link, '_blank')}
                                    onkeydown={(e) => item.link && (e.key === 'Enter' || e.key === ' ') && window.open(item.link, '_blank')}
                                    role={item.link ? "button" : "presentation"}
                                    tabindex={item.link ? 0 : -1}
                                >
                                    <span class="text-sm font-bold leading-tight">
                                        {item.model} - {item.caption}
                                    </span>
                                    
                                    {#if item.link}
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
                                            fill="none" viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Estilização customizada se necessário */
</style>
