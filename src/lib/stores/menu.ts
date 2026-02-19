import { writable } from 'svelte/store';

export interface MenuSection {
    id?: number;
    code: number;
    caption: string;
    isActive?: boolean;
    colorDark: string | null;
    colorLight: string | null;
}

export const menuSections = writable<MenuSection[]>([]);
export const isLoadingMenu = writable(false);
