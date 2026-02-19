import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { apiFetch } from '$lib/api';

// Interfaces based on DB schema
interface MenuItem {
    model: string;
    caption: string;
    link: string | null;
    isActive: boolean;
}

export interface MenuSection {
    code: number;
    caption: string;
    colorDark: string;
    colorLight: string;
    isActive: boolean;
    items: MenuItem[];
}

const CACHE_KEY_DATA = 'menu_data_v1';
const CACHE_KEY_VERSION = 'menu_version_v1';

function createMenuStore() {
    const { subscribe, set } = writable<MenuSection[]>([]);
    const isLoading = writable<boolean>(false);

    async function init() {
        if (!browser) return;

        isLoading.set(true);

        try {
            // 1. Load from cache immediately if available
            const cachedData = localStorage.getItem(CACHE_KEY_DATA);
            const cachedVersion = localStorage.getItem(CACHE_KEY_VERSION);

            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    set(parsedData);
                } catch (e) {
                    console.warn('[MenuStore] Failed to parse cache', e);
                }
            }

            // 2. Check for updates
            const versionRes = await apiFetch('/menu/version');
            if (!versionRes.ok) throw new Error(`Falha ao buscar versão: ${versionRes.status}`);

            const serverVersionData = await versionRes.json();
            const serverVersion = serverVersionData.version;

            // 3. If version mismatch or no cache, fetch fresh data
            if (serverVersion !== cachedVersion || !cachedData) {
                const menuRes = await apiFetch('/menu/full');

                if (menuRes.ok) {
                    const newData = await menuRes.json();

                    // Update Store
                    set(newData);

                    // Update Cache
                    try {
                        localStorage.setItem(CACHE_KEY_DATA, JSON.stringify(newData));
                        localStorage.setItem(CACHE_KEY_VERSION, serverVersion);
                    } catch (err) {
                        console.error('[MenuStore] Erro ao gravar LocalStorage:', err);
                    }
                }
            }

        } catch (error) {
            console.error('[MenuStore] Erro ao inicializar menu:', error);
        } finally {
            isLoading.set(false);
        }
    }

    return {
        subscribe,
        init,
        isLoading
    };
}

export const menuStore = createMenuStore();
