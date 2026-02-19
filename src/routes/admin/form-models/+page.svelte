<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { apiFetch } from '$lib/api';

    interface FormModel {
        id: string;
        modelId: string;
        title: string;
        description?: string;
        bgColor: string;
        cardBgColor: string;
        titleColor: string;
        googleDocsId?: string;
        config: any;
        isActive: boolean;
        createdAt?: string;
        updatedAt?: string;
    }

    let forms = $state<FormModel[]>([]);
    let loading = $state(true);
    let expandedForms = $state(new Set<string>());
    let expandedSections = $state(new Set<string>());
    let expandedRows = $state(new Set<string>());

    // Listar todos os modelos de formulários
    const loadForms = async () => {
        try {
            loading = true;
            const res = await apiFetch('/forms');
            if (res.ok) {
                forms = await res.json();
            }
        } catch (error) {
            console.error('Erro ao carregar formulários:', error);
        } finally {
            loading = false;
        }
    };

    function toggleExpand(id: string) {
        if (expandedForms.has(id)) {
            expandedForms.delete(id);
        } else {
            expandedForms.add(id);
        }
        expandedForms = new Set(expandedForms); 
    }

    function toggleExpandSection(formId: string, sectionIndex: number) {
        const key = `${formId}-${sectionIndex}`;
        if (expandedSections.has(key)) {
            expandedSections.delete(key);
        } else {
            expandedSections.add(key);
        }
        expandedSections = new Set(expandedSections);
    }

    function toggleExpandRow(formId: string, sectionIndex: number, rowIndex: number) {
        const key = `${formId}-${sectionIndex}-${rowIndex}`;
        if (expandedRows.has(key)) {
            expandedRows.delete(key);
        } else {
            expandedRows.add(key);
        }
        expandedRows = new Set(expandedRows);
    }

    // Atualizar campo específico inline
    async function updateField(form: FormModel, field: string, value: any) {
        if (form[field as keyof FormModel] === value) return;
        const oldValue = form[field as keyof FormModel];
        const index = forms.findIndex(f => f.id === form.id);
        if (index !== -1) {
            forms[index] = { ...forms[index], [field]: value };
        }

        try {
            const updatedForm = { ...forms[index] };
            const res = await apiFetch(`/forms/${form.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedForm)
            });
            
            if (!res.ok) {
                const err = await res.json();
                if (index !== -1) forms[index] = { ...forms[index], [field]: oldValue };
                alert('Erro ao salvar: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            if (index !== -1) forms[index] = { ...forms[index], [field]: oldValue };
            alert('Erro de conexão com o servidor');
        }
    }

    // Atualizar uma seção dentro do config
    async function updateSection(form: FormModel, sectionIndex: number, field: string, value: any) {
        const newSections = [...form.config.secoes];
        newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    // Deletar uma seção
    async function deleteSection(form: FormModel, sectionIndex: number) {
        if (!confirm('Excluir esta seção? Todos os campos nela serão perdidos.')) return;
        const newSections = form.config.secoes.filter((_: any, i: number) => i !== sectionIndex);
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    // Adicionar uma nova seção
    async function addSection(form: FormModel) {
        const newSection = { titulo: 'Nova Seção', color: '#2563eb', active: true, rows: [] };
        const newConfig = { ...form.config, secoes: [...(form.config.secoes || []), newSection] };
        await updateField(form, 'config', newConfig);
    }

    // Clipboard Section
    async function copySectionToClipboard(section: any) {
        try {
            await navigator.clipboard.writeText(JSON.stringify(section, null, 2));
            alert('Seção copiada!');
        } catch (err) { alert('Erro ao copiar'); }
    }

    async function pasteSectionFromClipboard(form: FormModel, sectionIndex: number) {
        try {
            const text = await navigator.clipboard.readText();
            const pastedSection = JSON.parse(text);
            if (!confirm('Substituir esta seção?')) return;
            const newSections = [...form.config.secoes];
            newSections[sectionIndex] = pastedSection;
            await updateField(form, 'config', { ...form.config, secoes: newSections });
            alert('Seção substituída!');
        } catch (err) { alert('Clipboard inválido'); }
    }

    // Operações de Row
    async function addRow(form: FormModel, sectionIndex: number) {
        const newRow = { id: `row-${Date.now()}`, cols: [] };
        const newSections = [...form.config.secoes];
        newSections[sectionIndex].rows = [...(newSections[sectionIndex].rows || []), newRow];
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    async function deleteRow(form: FormModel, sectionIndex: number, rowIndex: number) {
        if (!confirm('Excluir esta linha?')) return;
        const newSections = [...form.config.secoes];
        newSections[sectionIndex].rows = newSections[sectionIndex].rows.filter((_: any, i: number) => i !== rowIndex);
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    // Clipboard Row
    async function copyRowToClipboard(row: any) {
        try {
            await navigator.clipboard.writeText(JSON.stringify(row, null, 2));
            alert('Linha copiada!');
        } catch (err) { alert('Erro ao copiar'); }
    }

    async function pasteRowFromClipboard(form: FormModel, sectionIndex: number, rowIndex: number) {
        try {
            const text = await navigator.clipboard.readText();
            const pastedRow = JSON.parse(text);
            if (!confirm('Substituir esta linha?')) return;
            const newSections = [...form.config.secoes];
            newSections[sectionIndex].rows[rowIndex] = pastedRow;
            await updateField(form, 'config', { ...form.config, secoes: newSections });
            alert('Linha substituída!');
        } catch (err) { alert('Clipboard inválido'); }
    }

    // Operações de Coluna
    async function addCol(form: FormModel, sectionIndex: number, rowIndex: number) {
        const newCol = { id: `input_${Date.now()}`, type: 'text', label: 'Novo Campo', width: '', required: true };
        const newSections = [...form.config.secoes];
        newSections[sectionIndex].rows[rowIndex].cols = [...(newSections[sectionIndex].rows[rowIndex].cols || []), newCol];
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    async function updateCol(form: FormModel, sectionIndex: number, rowIndex: number, colIndex: number, field: string, value: any) {
        const newSections = [...form.config.secoes];
        newSections[sectionIndex].rows[rowIndex].cols[colIndex] = { ...newSections[sectionIndex].rows[rowIndex].cols[colIndex], [field]: value };
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    async function deleteCol(form: FormModel, sectionIndex: number, rowIndex: number, colIndex: number) {
        if (!confirm('Excluir este campo?')) return;
        const newSections = [...form.config.secoes];
        newSections[sectionIndex].rows[rowIndex].cols = newSections[sectionIndex].rows[rowIndex].cols.filter((_: any, i: number) => i !== colIndex);
        await updateField(form, 'config', { ...form.config, secoes: newSections });
    }

    async function copyColToClipboard(col: any) {
        try {
            await navigator.clipboard.writeText(JSON.stringify(col, null, 2));
            alert('Campo copiado!');
        } catch (err) { alert('Erro ao copiar'); }
    }

    async function pasteColFromClipboard(form: FormModel, sectionIndex: number, rowIndex: number, colIndex: number) {
        try {
            const text = await navigator.clipboard.readText();
            const pastedCol = JSON.parse(text);
            if (!confirm('Substituir esta campo?')) return;
            const newSections = [...form.config.secoes];
            newSections[sectionIndex].rows[rowIndex].cols[colIndex] = pastedCol;
            await updateField(form, 'config', { ...form.config, secoes: newSections });
            alert('Campo substituído!');
        } catch (err) { alert('Clipboard inválido'); }
    }

    async function deleteForm(id: string) {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
        try {
            const res = await apiFetch(`/forms/${id}`, { method: 'DELETE' });
            if (res.ok) {
                forms = forms.filter(f => f.id !== id);
                expandedForms.delete(id);
                expandedForms = new Set(expandedForms);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Criar um novo modelo básico para iniciar a edição inline
    async function createNewEmptyForm() {
        const body = {
            modelId: `novo-${Date.now()}`,
            title: 'Novo Formulário',
            description: '',
            bgColor: '#f8fafc',
            cardBgColor: '#ffffff',
            titleColor: '#1e3a8a',
            googleDocsId: '',
            config: { secoes: [] },
            isActive: true
        };

        try {
            const res = await apiFetch('/forms', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res.ok) {
                await loadForms();
            }
        } catch (error) {
            console.error(error);
        }
    }

    import { user } from '$lib/stores/auth';
    import { goto } from '$app/navigation';

    onMount(() => {
        const unsubscribe = user.subscribe(u => {
            if (u && u.roles !== 'sudo') {
                goto('/');
            }
        });
        
        loadForms();
        return unsubscribe;
    });
</script>

<div class="p-6 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Gerenciador de Formulários</h1>
            <p class="text-gray-500 mt-1">Edição rápida diretamente na tabela.</p>
        </div>
        <button 
            onclick={createNewEmptyForm}
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Novo Modelo
        </button>
    </div>

    {#if loading && forms.length === 0}
        <div class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    {/if}

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <th class="p-4 w-10"></th>
                        <th class="p-4">Model ID</th>
                        <th class="p-4">Google Docs ID</th>
                        <th class="p-4 text-center">Cor-Fundo</th>
                        <th class="p-4">Título do Formulário</th>
                        <th class="p-4">Descrição</th>
                        <th class="p-4 text-center">Cor-Título</th>
                        <th class="p-4 text-center">Cor-Card</th>
                        <th class="p-4 text-center">Ativo</th>
                        <th class="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    {#each forms as form (form.id)}
                        {@const isExpanded = expandedForms.has(form.id)}
                        <tr class="hover:bg-gray-50/50 transition-colors group {isExpanded ? 'bg-indigo-50/30' : ''}">
                            <!-- Expansion Arrow -->
                            <td class="p-4">
                                <button 
                                    onclick={() => toggleExpand(form.id)}
                                    class="p-1 hover:bg-white rounded-md transition-all {isExpanded ? 'rotate-90 text-indigo-600' : 'text-gray-400'}"
                                    aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </td>

                            <!-- Model ID -->
                            <td class="p-4">
                                <input 
                                    type="text" 
                                    value={form.modelId} 
                                    onblur={(e) => updateField(form, 'modelId', e.currentTarget.value)}
                                    onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                    class="w-32 bg-white/50 border-transparent focus:border-indigo-300 focus:bg-white text-sm font-bold text-indigo-600 font-mono px-2 py-1 rounded-md outline-none transition-all"
                                />
                            </td>

                            <!-- Google Docs ID -->
                            <td class="p-4">
                                <div class="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={form.googleDocsId || ''} 
                                        onblur={(e) => updateField(form, 'googleDocsId', e.currentTarget.value)}
                                        onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        class="w-32 bg-white/50 border-transparent focus:border-indigo-300 focus:bg-white text-xs text-gray-400 font-mono px-2 py-1 rounded-md outline-none transition-all"
                                        placeholder="ID do Google Docs"
                                    />
                                    {#if form.googleDocsId}
                                        <a 
                                            href="https://docs.google.com/document/d/{form.googleDocsId}/edit" 
                                            target="_blank"
                                            class="text-blue-400 hover:text-blue-600 transition-colors"
                                            title="Abrir no Google Docs"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    {/if}
                                </div>
                            </td>

                            <!-- Cor Fundo -->
                            <td class="p-4">
                                <div class="flex flex-col items-center gap-1">
                                    <input 
                                        type="color" 
                                        value={form.bgColor} 
                                        onchange={(e) => updateField(form, 'bgColor', e.currentTarget.value)}
                                        class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                                    />
                                    <span class="text-[9px] font-mono text-gray-400 uppercase">{form.bgColor}</span>
                                </div>
                            </td>

                            <!-- Título -->
                            <td class="p-4">
                                <input 
                                    type="text" 
                                    value={form.title} 
                                    onblur={(e) => updateField(form, 'title', e.currentTarget.value)}
                                    onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                    class="w-full bg-transparent border-transparent focus:border-indigo-300 focus:bg-white p-1.5 rounded-lg text-sm font-bold text-gray-900 outline-none transition-all"
                                />
                            </td>

                            <!-- Descrição -->
                            <td class="p-4">
                                <input 
                                    type="text" 
                                    value={form.description || ''} 
                                    placeholder="Descrição (opcional)"
                                    onblur={(e) => updateField(form, 'description', e.currentTarget.value)}
                                    onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                    class="w-full bg-transparent border-transparent focus:border-indigo-300 focus:bg-white p-1.5 rounded-lg text-xs text-gray-400 outline-none transition-all italic"
                                />
                            </td>

                            <!-- Cor Título -->
                            <td class="p-4">
                                <div class="flex flex-col items-center gap-1">
                                    <input 
                                        type="color" 
                                        value={form.titleColor} 
                                        onchange={(e) => updateField(form, 'titleColor', e.currentTarget.value)}
                                        class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                                    />
                                    <span class="text-[9px] font-mono text-gray-400 uppercase">{form.titleColor}</span>
                                </div>
                            </td>

                            <!-- Cor Card -->
                            <td class="p-4">
                                <div class="flex flex-col items-center gap-1">
                                    <input 
                                        type="color" 
                                        value={form.cardBgColor} 
                                        onchange={(e) => updateField(form, 'cardBgColor', e.currentTarget.value)}
                                        class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                                    />
                                    <span class="text-[9px] font-mono text-gray-400 uppercase">{form.cardBgColor}</span>
                                </div>
                            </td>

                            <!-- Ativo -->
                            <td class="p-4">
                                <div class="flex justify-center items-center h-full">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={form.isActive} 
                                            onchange={(e) => updateField(form, 'isActive', e.currentTarget.checked)}
                                            class="sr-only peer"
                                        />
                                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            </td>

                            <!-- Ações -->
                            <td class="p-4">
                                <div class="flex justify-end gap-2">
                                    <a 
                                        href="/form-show/{form.modelId}" 
                                        target="_blank"
                                        class="p-2 text-gray-400 hover:text-indigo-600 bg-white shadow-sm rounded-lg transition-all"
                                        title="Ver formulário"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </a>
                                    <button 
                                        onclick={() => deleteForm(form.id)}
                                        class="p-2 text-gray-400 hover:text-red-600 bg-white shadow-sm rounded-lg transition-all"
                                        title="Excluir"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <!-- Expanded Section List -->
                        {#if isExpanded}
                            <tr transition:fade>
                                <td colspan="8" class="p-4 bg-gray-50/50">
                                    <div class="ml-12 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div class="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lista de Seções</h4>
                                            <button 
                                                onclick={() => addSection(form)}
                                                class="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                                </svg>
                                                Nova Seção
                                            </button>
                                        </div>
                                        <table class="w-full text-left border-collapse">
                                            <thead class="bg-gray-50/30 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <tr>
                                                    <th class="p-3 w-10"></th>
                                                    <th class="p-3 w-10 text-center">#</th>
                                                    <th class="p-3">Título da Seção</th>
                                                    <th class="p-3 text-center">Cor do Título</th>
                                                    <th class="p-3 text-center">Borda Ativa</th>
                                                    <th class="p-3 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-50">
                                                {#each form.config.secoes as secao, sIdx}
                                                    {@const sectionKey = `${form.id}-${sIdx}`}
                                                    {@const isSectionExpanded = expandedSections.has(sectionKey)}
                                                    <tr class="hover:bg-gray-50/30 transition-colors {isSectionExpanded ? 'bg-amber-50/20' : ''}">
                                                        <td class="p-3">
                                                            <button 
                                                                onclick={() => toggleExpandSection(form.id, sIdx)}
                                                                class="p-1 hover:bg-white rounded transition-all {isSectionExpanded ? 'rotate-90 text-amber-600' : 'text-gray-300'}"
                                                                aria-label={isSectionExpanded ? 'Recolher Seção' : 'Expandir Seção'}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                        <td class="p-3 text-center text-xs font-mono text-gray-400">{sIdx + 1}</td>
                                                        <td class="p-3">
                                                            <input 
                                                                type="text" 
                                                                value={secao.titulo} 
                                                                onblur={(e) => updateSection(form, sIdx, 'titulo', e.currentTarget.value)}
                                                                class="w-full bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 p-0"
                                                                aria-label="Título da Seção"
                                                            />
                                                        </td>
                                                        <td class="p-3">
                                                            <div class="flex justify-center">
                                                                <input 
                                                                    type="color" 
                                                                    value={secao.color} 
                                                                    onchange={(e) => updateSection(form, sIdx, 'color', e.currentTarget.value)}
                                                                    class="w-6 h-6 rounded-full border-none cursor-pointer bg-transparent"
                                                                    aria-label="Cor da Seção"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td class="p-3">
                                                            <div class="flex justify-center">
                                                                <button 
                                                                    onclick={() => updateSection(form, sIdx, 'active', !secao.active)}
                                                                    class="text-xs px-2 py-1 rounded-md font-bold transition-all {secao.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}"
                                                                >
                                                                    {secao.active ? 'Ativo' : 'Inativo'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td class="p-3 text-right">
                                                            <div class="flex justify-end gap-1">
                                                                <button 
                                                                    onclick={() => copySectionToClipboard(secao)}
                                                                    class="p-1.5 text-gray-300 hover:text-indigo-600 transition-colors"
                                                                    title="Copiar Seção (Clipboard)"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    onclick={() => pasteSectionFromClipboard(form, sIdx)}
                                                                    class="p-1.5 text-gray-300 hover:text-green-600 transition-colors"
                                                                    title="Colar e Substituir"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    onclick={() => deleteSection(form, sIdx)}
                                                                    class="p-1.5 text-gray-300 hover:text-red-600 transition-colors"
                                                                    title="Excluir Seção"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {#if isSectionExpanded}
                                                        <tr transition:fade>
                                                            <td colspan="6" class="p-3 bg-amber-50/10">
                                                                <div class="ml-8 bg-white rounded-lg border border-amber-100 shadow-sm overflow-hidden">
                                                                    <div class="p-2 bg-amber-50/30 border-b border-amber-100 flex justify-between items-center text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                                                        <span>Linhas da Seção</span>
                                                                        <button 
                                                                            onclick={() => addRow(form, sIdx)}
                                                                            class="bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-0.5 rounded transition-all"
                                                                        >
                                                                            + Add Linha
                                                                        </button>
                                                                    </div>
                                                                    <table class="w-full text-left border-collapse">
                                                                        <tbody class="divide-y divide-gray-50">
                                                                            {#each secao.rows || [] as row, rIdx}
                                                                                {@const rowKey = `${form.id}-${sIdx}-${rIdx}`}
                                                                                {@const isRowExpanded = expandedRows.has(rowKey)}
                                                                                <tr class="hover:bg-gray-50/50 transition-colors {isRowExpanded ? 'bg-emerald-50/20' : ''}">
                                                                                    <td class="p-2 w-10">
                                                                                        <button 
                                                                                            onclick={() => toggleExpandRow(form.id, sIdx, rIdx)}
                                                                                            class="p-1 hover:bg-white rounded transition-all {isRowExpanded ? 'rotate-90 text-emerald-600' : 'text-gray-300'}"
                                                                                            aria-label={isRowExpanded ? 'Recolher Linha' : 'Expandir Linha'}
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </td>
                                                                                    <td class="p-2 w-10 text-center text-[10px] font-mono text-gray-400">{rIdx + 1}</td>
                                                                                    <td class="p-2 text-xs text-gray-500 italic flex items-center gap-2">
                                                                                        <span class="font-bold py-0.5 px-1.5 bg-gray-100 rounded text-[10px] uppercase">Row ID:</span>
                                                                                        <input 
                                                                                            type="text" 
                                                                                            value={row.id} 
                                                                                            onblur={(e) => {
                                                                                                const newSections = [...form.config.secoes];
                                                                                                newSections[sIdx].rows[rIdx].id = e.currentTarget.value;
                                                                                                updateField(form, 'config', { ...form.config, secoes: newSections });
                                                                                            }}
                                                                                            class="bg-transparent border-none p-0 text-xs font-mono text-indigo-600 focus:ring-0 w-full"
                                                                                        />
                                                                                    </td>
                                                                                    <td class="p-2 text-right">
                                                                                        <div class="flex justify-end gap-1">
                                                                                            <button onclick={() => copyRowToClipboard(row)} class="p-1 text-gray-300 hover:text-indigo-500" title="Copiar Linha"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg></button>
                                                                                            <button onclick={() => pasteRowFromClipboard(form, sIdx, rIdx)} class="p-1 text-gray-300 hover:text-green-500" title="Colar Linha"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                                                                                            <button onclick={() => deleteRow(form, sIdx, rIdx)} class="p-1 text-gray-300 hover:text-red-500" title="Excluir Linha"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>

                                                                                {#if isRowExpanded}
                                                                                    <tr transition:fade>
                                                                                        <td colspan="4" class="p-2 bg-emerald-50/10">
                                                                                            <div class="ml-6 bg-white rounded-lg border border-emerald-100 shadow-sm overflow-hidden">
                                                                                                <div class="p-2 bg-emerald-50/30 border-b border-emerald-100 flex justify-between items-center text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                                                                                                    <span>Configuração de Campos (Cols)</span>
                                                                                                    <button 
                                                                                                        onclick={() => addCol(form, sIdx, rIdx)}
                                                                                                        class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded transition-all text-[10px]"
                                                                                                    >
                                                                                                        + Add Campo
                                                                                                    </button>
                                                                                                </div>
                                                                                                <table class="w-full text-left border-separate border-spacing-0">
                                                                                                    <thead class="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase">
                                                                                                        <tr>
                                                                                                            <th class="p-2 border-b">ID</th>
                                                                                                            <th class="p-2 border-b">Tipo</th>
                                                                                                            <th class="p-2 border-b">Label</th>
                                                                                                            <th class="p-2 border-b">Select Options (JSON)</th>
                                                                                                            <th class="p-2 border-b text-center">Width</th>
                                                                                                            <th class="p-2 border-b text-center">Req</th>
                                                                                                            <th class="p-2 border-b text-right">Ações</th>
                                                                                                        </tr>
                                                                                                    </thead>
                                                                                                    <tbody class="divide-y divide-gray-50">
                                                                                                        {#each row.cols || [] as col, cIdx}
                                                                                                            <tr class="hover:bg-gray-50/50 transition-colors">
                                                                                                                <td class="p-2">
                                                                                                                    <input type="text" value={col.id} onblur={(e) => updateCol(form, sIdx, rIdx, cIdx, 'id', e.currentTarget.value)} class="w-24 bg-transparent border-none text-xs font-mono text-indigo-600 p-0 focus:ring-0" />
                                                                                                                </td>
                                                                                                                <td class="p-2">
                                                                                                                    <select 
                                                                                                                        value={col.type} 
                                                                                                                        onchange={(e) => updateCol(form, sIdx, rIdx, cIdx, 'type', e.currentTarget.value)}
                                                                                                                        class="bg-transparent border-none text-xs p-0 focus:ring-0 text-gray-600 font-medium"
                                                                                                                    >
                                                                                                                        <option value="text">Text</option>
                                                                                                                        <option value="password">Password</option>
                                                                                                                        <option value="email">Email</option>
                                                                                                                        <option value="tel">Telefone</option>
                                                                                                                        <option value="url">URL</option>
                                                                                                                        <option value="number">Number</option>
                                                                                                                        <option value="date">Date</option>
                                                                                                                        <option value="time">Time</option>
                                                                                                                        <option value="datetime-local">DateTime Local</option>
                                                                                                                        <option value="select">Select</option>
                                                                                                                        <option value="checkbox">Checkbox</option>
                                                                                                                        <option value="textarea">Textarea</option>
                                                                                                                        <option value="search">Search</option>
                                                                                                                        <option value="hidden">Hidden</option>
                                                                                                                        <option value="cep">CEP</option>
                                                                                                                        <option value="readonly">Readonly</option>
                                                                                                                    </select>
                                                                                                                </td>
                                                                                                                <td class="p-2">
                                                                                                                    <input type="text" value={col.label} onblur={(e) => updateCol(form, sIdx, rIdx, cIdx, 'label', e.currentTarget.value)} class="w-full bg-transparent border-none text-xs p-0 focus:ring-0 text-gray-700" />
                                                                                                                </td>
                                                                                                                <td class="p-2">
                                                                                                                    {#if col.type === 'select'}
                                                                                                                        <input 
                                                                                                                            type="text" 
                                                                                                                            value={JSON.stringify(col.options || [])}
                                                                                                                            onblur={(e) => {
                                                                                                                                try {
                                                                                                                                    const data = JSON.parse(e.currentTarget.value);
                                                                                                                                    updateCol(form, sIdx, rIdx, cIdx, 'options', data);
                                                                                                                                } catch (err) { }
                                                                                                                            }}
                                                                                                                            class="w-full bg-emerald-50/10 border border-emerald-100 text-[10px] p-1 rounded" 
                                                                                                                        />
                                                                                                                    {:else}
                                                                                                                        <span class="text-[10px] text-gray-300">N/A</span>
                                                                                                                    {/if}
                                                                                                                </td>
                                                                                                                <td class="p-2 text-center">
                                                                                                                    <input type="text" value={col.width} onblur={(e) => updateCol(form, sIdx, rIdx, cIdx, 'width', e.currentTarget.value)} class="w-10 bg-transparent border-none text-xs p-0 text-center focus:ring-0 text-gray-500 font-mono" />
                                                                                                                </td>
                                                                                                                <td class="p-2 text-center">
                                                                                                                    <input type="checkbox" checked={col.required !== false} onchange={(e) => updateCol(form, sIdx, rIdx, cIdx, 'required', e.currentTarget.checked)} class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                                                                                                </td>
                                                                                                                <td class="p-2 text-right">
                                                                                                                    <div class="flex justify-end gap-1">
                                                                                                                        <button onclick={() => copyColToClipboard(col)} class="p-1 text-gray-300 hover:text-indigo-400" title="Copiar"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg></button>
                                                                                                                        <button onclick={() => pasteColFromClipboard(form, sIdx, rIdx, cIdx)} class="p-1 text-gray-300 hover:text-green-400" title="Colar"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                                                                                                                        <button onclick={() => deleteCol(form, sIdx, rIdx, cIdx)} class="p-1 text-gray-300 hover:text-red-400" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                                                                                    </div>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        {/each}
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                {#if !row.cols || row.cols.length === 0}
                                                                                                    <div class="p-3 text-center text-[10px] text-gray-400 italic">Nenhum campo definido.</div>
                                                                                                {/if}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                {/if}
                                                                            {/each}
                                                                        </tbody>
                                                                    </table>
                                                                    {#if !secao.rows || secao.rows.length === 0}
                                                                        <div class="p-3 text-center text-[10px] text-gray-400 italic">Nenhuma linha nesta seção.</div>
                                                                    {/if}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    {/if}
                                                {/each}
                                            </tbody>
                                        </table>
                                        {#if !form.config.secoes || form.config.secoes.length === 0}
                                            <div class="p-4 text-center text-xs text-gray-400 italic">
                                                Nenhuma seção definida neste modelo.
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>

        {#if forms.length === 0 && !loading}
            <div class="bg-white p-12 text-center">
                <div class="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900">Nenhum modelo encontrado</h3>
                <p class="text-gray-500 mt-2 mb-6">Crie um novo modelo para começar.</p>
                <button 
                    onclick={createNewEmptyForm}
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    Criar Novo Modelo
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Estilos customizados se necessário */
    :global(body) {
        background-color: #f8fafc;
    }
</style>
