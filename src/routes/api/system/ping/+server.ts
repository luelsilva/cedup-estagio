import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { keepAlive } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        // Insere um novo registro para manter o banco ativo
        await db.insert(keepAlive).values({
            createdAt: new Date()
        });

        return json({
            status: 'success',
            message: 'Keep alive recorded',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('[KEEP-ALIVE] Error:', error);
        return json({ status: 'error', message: 'Database ping failed' }, { status: 500 });
    }
};
