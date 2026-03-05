import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user || (locals.user.roles !== 'sudo' && locals.user.roles !== 'admin')) {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        // Pegar lista de tabelas do schema public
        const tablesResult = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const stats = [];

        for (const table of tablesResult as any) {
            const countResult = await client.unsafe(`SELECT count(*) FROM "${table.table_name}"`);
            stats.push({
                name: table.table_name,
                count: parseInt(countResult[0].count)
            });
        }

        return json({
            database: 'PostgreSQL (Supabase) - SvelteKit Backend',
            tables: stats,
            totalTables: stats.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[DB Controller] Erro ao obter estatísticas:', error);
        return json({ error: 'Erro ao obter estatísticas do banco de dados' }, { status: 500 });
    }
};
