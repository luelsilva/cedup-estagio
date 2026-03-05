import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const results = await db.select()
            .from(menuSections)
            .where(eq(menuSections.isActive, true))
            .orderBy(menuSections.code);

        return json(results);
    } catch (error) {
        console.error('[MenuAPI] Erro ao buscar seções:', error);
        return json({ error: 'Erro ao buscar seções do menu' }, { status: 500 });
    }
};
