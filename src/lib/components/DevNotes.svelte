<script lang="ts">
    import { onMount } from 'svelte';
    import { devNotes } from '$lib/stores/devNotes.svelte';
    import { fade, fly } from 'svelte/transition';

    onMount(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            // Atalho: F2
            if (e.key === 'F2') {
                devNotes.toggle();
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    });
</script>

{#if devNotes.isVisible}
    <div class="dev-notes-overlay" transition:fade={{ duration: 200 }}>
        <div class="dev-notes-panel" transition:fly={{ y: 20, duration: 300 }}>
            <div class="dev-notes-header">
                <h3>🛠️ DevNotes <span class="shortcut-hint">(F2 para fechar)</span></h3>
                <button class="close-btn" onclick={() => devNotes.toggle()}>✕</button>
            </div>
            
            <div class="dev-notes-content">
                {#if devNotes.notes.length === 0}
                    <div class="empty-state">
                        <p>Nenhuma nota técnica definida para esta página.</p>
                        <small>Use <code>devNotes.setNotes([])</code> no onMount desta página.</small>
                        <br><br>
                        <small style="color: #565f89;">Veja como usar em:<br><code>cedup\DEVNOTES_GUIDE.md</code></small>
                    </div>
                {:else}
                    <ul class="notes-list">
                        {#each devNotes.notes as note}
                            <li>{@html note}</li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .dev-notes-overlay {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 400px; /* Painel lateral */
        background-color: transparent; /* Fundo transparente, apenas o painel visível */
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        pointer-events: none; /* Deixa clicar no fundo se não estiver em cima do painel */
    }

    .dev-notes-panel {
        width: 100%;
        height: 100%;
        background-color: #1a1b26; /* Tema dark (Tokyo Night style) */
        color: #a9b1d6;
        box-shadow: -5px 0 25px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        pointer-events: auto; /* Reabilita cliques no painel */
        font-family: 'Fira Code', 'Consolas', monospace;
        border-left: 2px solid #7aa2f7;
    }

    .dev-notes-header {
        padding: 1rem;
        background-color: #16161e;
        border-bottom: 1px solid #2f3549;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .dev-notes-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #7aa2f7;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .shortcut-hint {
        font-size: 0.75rem;
        color: #565f89;
        font-weight: 400;
    }

    .close-btn {
        background: none;
        border: none;
        color: #565f89;
        cursor: pointer;
        font-size: 1.2rem;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: #f7768e;
    }

    .dev-notes-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
    }

    .empty-state {
        text-align: center;
        opacity: 0.5;
        margin-top: 2rem;
    }

    .notes-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .notes-list li {
        background-color: #24283b;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 3px solid #9ece6a; /* Verde para itens */
        line-height: 1.5;
        font-size: 0.9rem;
    }

    /* Estilização para código dentro das notas */
    :global(.dev-notes-panel code) {
        background-color: #414868;
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        color: #e0af68;
        font-size: 0.85em;
    }

    :global(.dev-notes-panel strong) {
        color: #bb9af7;
        font-weight: 700;
    }
</style>
