
// Estado global simples usando Svelte 5 Runes
// O arquivo é .svelte.ts para permitir o uso de runes em módulos TS
let notes = $state<string[]>([]);
let isVisible = $state(false);

export const devNotes = {
    get notes() { return notes; },
    get isVisible() { return isVisible; },

    setNotes(newNotes: string[]) {
        notes = newNotes;
    },

    addNote(note: string) {
        notes.push(note);
    },

    clear() {
        notes = [];
    },

    toggle() {
        isVisible = !isVisible;
    }
};
