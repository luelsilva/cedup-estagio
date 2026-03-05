import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const getDatabaseUrl = () => {
    if (!env.DATABASE_URL) {
        throw new Error(
            'DATABASE_URL não encontrada no .env. ' +
            'Adicione a connection string do PostgreSQL do Supabase.'
        );
    }
    return env.DATABASE_URL;
};

// Criar cliente PostgreSQL (otimizado para serverless ou local)
export const client = postgres(getDatabaseUrl(), {
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false // Desabilitar prepared statements para compatibilidade com pgBouncer
});

export const db = drizzle(client, { schema });
