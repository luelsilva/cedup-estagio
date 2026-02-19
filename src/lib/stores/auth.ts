import { writable } from 'svelte/store';

// Define the user type explicitly or use any for flexibility
export interface User {
    id: string;
    email: string;
    name?: string;
    roles?: string;
    mustChangePassword?: boolean;
    [key: string]: any;
}

export const user = writable<User | null>(null);
