<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { apiFetch } from '$lib/api';
    import { fade, slide } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    // Interfaces
    interface Section {
        id: string;
        code: number;
        caption: string;
        colorDark: string;
        colorLight: string;
        isActive: boolean;
        isExpanded?: boolean; // UI only
    }

    interface Item {
        id: string;
        sectionId: number;
        model: string;
        caption: string;
        link: string;
        isActive: boolean;
    }

    // State
    let sections = $state<Section[]>([]);
    let items = $state<Item[]>([]);
    let loading = $state(true);
    let errorMessage = $state('');
    let successMessage = $state('');

    // Modal State
    let showSectionModal = $state(false);
    let showItemModal = $state(false);
    let editingSection = $state<Section | null>(null);
    let editingItem = $state<Item | null>(null);
    let selectedSectionId = $state<string | null>(null); // For item creation context

    // Form Data
    let sectionForm = $state({
        code: 0,
        caption: '',
        colorDark: '#000000',
        colorLight: '#ffffff',
        isActive: true
    });

    let itemForm = $state({
        sectionId: 0,
        model: '',
        caption: '',
        link: '',
        isActive: true
    });

    import { user } from '$lib/stores/auth';

    onMount(() => {
        const unsubscribe = user.subscribe(u => {
            if (u && u.roles !== 'sudo') {
                goto('/');
            }
        });
        
        loadData();
        return unsubscribe;
    });

    async function loadData() {
        loading = true;
        try {
            const [sectionsRes, itemsRes] = await Promise.all([
                apiFetch('/admin/menu/sections'),
                apiFetch('/admin/menu/items')
            ]);

            if (sectionsRes.ok && itemsRes.ok) {
                sections = await sectionsRes.json();
                items = await itemsRes.json();
            } else {
                errorMessage = 'Falha ao carregar dados do menu.';
            }
        } catch (error) {
            errorMessage = 'Erro de conexão ao carregar dados.';
        } finally {
            loading = false;
        }
    }

    function getItemsForSection(sectionId: string) {
        return items.filter(i => i.sectionId === sections.find(s => s.id === sectionId)?.code);
    }
    
    // --- Actions: Sections ---

    function openNewSectionModal() {
        editingSection = null;
        sectionForm = { code: 0, caption: '', colorDark: '#2196F3', colorLight: '#E3F2FD', isActive: true };
        showSectionModal = true;
    }

    function openEditSectionModal(section: Section) {
        editingSection = section;
        sectionForm = { ...section };
        showSectionModal = true;
    }

    async function saveSection() {
        const method = editingSection ? 'PUT' : 'POST';
        const url = editingSection 
            ? `/admin/menu/sections/${editingSection.id}`
            : '/admin/menu/sections';

        try {
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(sectionForm)
            });

            if (res.ok) {
                showSectionModal = false;
                successMessage = editingSection ? 'Seção atualizada!' : 'Seção criada!';
                loadData(); // Reload to refresh list
                setTimeout(() => successMessage = '', 3000);
            } else {
                const err = await res.json();
                alert(`Erro: ${err.error || 'Falha ao salvar'}`);
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    }

    async function deleteSection(section: Section) {
        if (!confirm(`Tem certeza que deseja excluir a seção "${section.caption}"?\nIsso apagará TODOS os itens filhos!`)) return;

        try {
            const res = await apiFetch(`/admin/menu/sections/${section.id}`, { method: 'DELETE' });
            if (res.ok) {
                successMessage = 'Seção removida!';
                loadData();
                setTimeout(() => successMessage = '', 3000);
            } else {
                alert('Erro ao excluir');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    }

    // --- Actions: Items ---

    function openNewItemModal(sectionCode: number) {
        editingItem = null;
        itemForm = { sectionId: sectionCode, model: '', caption: '', link: '', isActive: true };
        showItemModal = true;
    }

    function openEditItemModal(item: Item) {
        editingItem = item;
        itemForm = { ...item };
        showItemModal = true;
    }

    async function saveItem() {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem 
            ? `/admin/menu/items/${editingItem.id}` 
            : '/admin/menu/items';

        try {
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(itemForm)
            });

            if (res.ok) {
                showItemModal = false;
                successMessage = editingItem ? 'Item atualizado!' : 'Item criado!';
                loadData();
                setTimeout(() => successMessage = '', 3000);
            } else {
                const err = await res.json();
                alert(`Erro: ${err.error || 'Falha ao salvar'}`);
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    }

    async function deleteItem(item: Item) {
        if (!confirm(`Excluir item "${item.caption}"?`)) return;

        try {
            const res = await apiFetch(`/admin/menu/items/${item.id}`, { method: 'DELETE' });
            if (res.ok) {
                successMessage = 'Item removido!';
                loadData();
                setTimeout(() => successMessage = '', 3000);
            } else {
                alert('Erro ao excluir');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    }
    
    function toggleExpand(section: Section) {
       section.isExpanded = !section.isExpanded;
       sections = [...sections]; // Trigger reactivity
    }

</script>

<svelte:head>
    <title>Gerenciar Menu | Admin</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Gerenciamento de Menu</h1>
            <p class="text-sm text-gray-500">Adicione, edite ou remova seções e itens do menu de estágio.</p>
        </div>
        <button 
            onclick={openNewSectionModal}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Nova Seção
        </button>
    </div>

    {#if successMessage}
        <div transition:fade class="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm flex items-center justify-between">
            <span class="font-medium">{successMessage}</span>
            <button onclick={() => successMessage = ''} class="text-green-600 hover:text-green-800">&times;</button>
        </div>
    {/if}

    {#if errorMessage}
        <div class="p-4 bg-red-50 text-red-700 rounded border border-red-200 mb-6">
            {errorMessage}
        </div>
    {/if}

    {#if loading}
        <div class="space-y-4">
            {#each Array(3) as _}
                <div class="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
            {/each}
        </div>
    {:else}
        <div class="space-y-4">
            {#each sections as section (section.id)}
                <div 
                    class="bg-white border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
                    class:border-blue-200={section.isActive}
                    class:border-gray-200={!section.isActive}
                    class:opacity-60={!section.isActive}
                >
                    <!-- Section Header -->
                    <div class="flex items-center p-4 bg-gray-50 border-b border-gray-100 gap-4">
                        <button 
                            onclick={() => toggleExpand(section)}
                            class="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                            aria-label={section.isExpanded ? 'Recolher seção' : 'Expandir seção'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform duration-200" class:rotate-90={section.isExpanded} viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>

                        <div 
                            class="w-3 h-10 rounded" 
                            style="background-color: {section.colorDark};"
                            title="Cor da Seção"
                        ></div>

                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">#{section.code}</span>
                                {#if !section.isActive}
                                    <span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Inativo</span>
                                {/if}
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg">{section.caption}</h3>
                        </div>

                        <div class="flex items-center gap-2">
                            <button 
                                onclick={() => openEditSectionModal(section)}
                                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar Seção"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button 
                                onclick={() => deleteSection(section)}
                                class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir Seção"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Items List (Details) -->
                    {#if section.isExpanded}
                        {@const sectionItems = getItemsForSection(section.id)}
                        <div transition:slide class="bg-gray-50 p-4 border-t border-gray-100">
                            <div class="mb-3 flex justify-between items-center">
                                <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Itens desta seção</h4>
                                <button 
                                    onclick={() => openNewItemModal(section.code)}
                                    class="text-xs bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1"
                                >
                                    + Adicionar Item
                                </button>
                            </div>
                            
                            {#if sectionItems.length === 0}
                                <div class="text-center py-4 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                                    Nenhum item cadastrado nesta seção.
                                </div>
                            {:else}
                                <div class="grid gap-2">
                                    {#each sectionItems as item (item.id)}
                                        <div 
                                            class="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors"
                                            class:opacity-60={!item.isActive}
                                        >
                                            <div class="flex flex-1 items-center gap-3">
                                                <span class="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.model}</span>
                                                <span class="text-gray-800 font-medium">{item.caption}</span>
                                                {#if item.link}
                                                    <a href={item.link} target="_blank" class="text-blue-400 hover:text-blue-600" aria-label="Abrir link em nova aba">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                {:else}
                                                     <span class="text-xs text-gray-400 italic">(sem link)</span>
                                                {/if}
                                            </div>
                                            
                                            <div class="flex items-center gap-1">
                                                <button 
                                                    onclick={() => openEditItemModal(item)}
                                                    class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    aria-label="Editar item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onclick={() => deleteItem(item)}
                                                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    aria-label="Excluir item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Section -->
{#if showSectionModal}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade>
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" transition:slide={{ duration: 200, axis: 'y' }}>
            <h2 class="text-xl font-bold text-gray-800 mb-4">{editingSection ? 'Editar Seção' : 'Nova Seção'}</h2>
            
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); saveSection(); }}>
                <div>
                    <label for="sectionCode" class="block text-sm font-medium text-gray-700 mb-1">Código (ID numérico)</label>
                    <input id="sectionCode" type="number" bind:value={sectionForm.code} class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                </div>
                
                <div>
                    <label for="sectionCaption" class="block text-sm font-medium text-gray-700 mb-1">Título da Seção</label>
                    <input id="sectionCaption" type="text" bind:value={sectionForm.caption} class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="sectionColorDark" class="block text-sm font-medium text-gray-700 mb-1">Cor Escura</label>
                        <div class="flex gap-2">
                             <input type="color" bind:value={sectionForm.colorDark} class="h-10 w-10 rounded border border-gray-300 cursor-pointer">
                             <input id="sectionColorDark" type="text" bind:value={sectionForm.colorDark} class="flex-1 rounded-lg border-gray-300 text-sm">
                        </div>
                    </div>
                    <div>
                        <label for="sectionColorLight" class="block text-sm font-medium text-gray-700 mb-1">Cor Clara (Fundo)</label>
                        <div class="flex gap-2">
                             <input type="color" bind:value={sectionForm.colorLight} class="h-10 w-10 rounded border border-gray-300 cursor-pointer">
                             <input id="sectionColorLight" type="text" bind:value={sectionForm.colorLight} class="flex-1 rounded-lg border-gray-300 text-sm">
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <input type="checkbox" id="secActive" bind:checked={sectionForm.isActive} class="rounded text-blue-600 focus:ring-blue-500">
                    <label for="secActive" class="text-sm text-gray-700 font-medium">Seção Ativa?</label>
                </div>

                <div class="flex justify-end gap-3 mt-6 pt-2">
                    <button type="button" onclick={() => showSectionModal = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">Salvar</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Modal Item -->
{#if showItemModal}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade>
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" transition:slide={{ duration: 200, axis: 'y' }}>
            <h2 class="text-xl font-bold text-gray-800 mb-4">{editingItem ? 'Editar Item' : 'Novo Item'}</h2>
            
            <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); saveItem(); }}>
                <div>
                     <label for="itemParentSection" class="block text-sm font-medium text-gray-700 mb-1">Seção Pai (Código)</label>
                     <input id="itemParentSection" type="number" bind:value={itemForm.sectionId} class="w-full rounded-lg border-gray-300 bg-gray-100 text-gray-500 shadow-sm" readonly>
                </div>

                <div>
                    <label for="itemModel" class="block text-sm font-medium text-gray-700 mb-1">Modelo (Código Item)</label>
                    <input id="itemModel" type="text" bind:value={itemForm.model} class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required placeholder="Ex: 1101">
                </div>
                
                <div>
                    <label for="itemCaption" class="block text-sm font-medium text-gray-700 mb-1">Título do Item</label>
                    <input id="itemCaption" type="text" bind:value={itemForm.caption} class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                </div>
                
                <div>
                    <label for="itemLink" class="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                    <input id="itemLink" type="text" bind:value={itemForm.link} class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="https://... ou /...">
                </div>

                <div class="flex items-center gap-2">
                    <input type="checkbox" id="itemActive" bind:checked={itemForm.isActive} class="rounded text-blue-600 focus:ring-blue-500">
                    <label for="itemActive" class="text-sm text-gray-700 font-medium">Item Ativo?</label>
                </div>

                <div class="flex justify-end gap-3 mt-6 pt-2">
                    <button type="button" onclick={() => showItemModal = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">Salvar</button>
                </div>
            </form>
        </div>
    </div>
{/if}
