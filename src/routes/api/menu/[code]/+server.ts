import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections, menuItems } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { code } = params;
        if (!code) {
            return json({ error: 'O parâmetro code é obrigatório' }, { status: 400 });
        }

        const sectionCode = parseInt(code);

        // Check if section exists and is active
        const [section] = await db.select()
            .from(menuSections)
            .where(eq(menuSections.code, sectionCode))
            .limit(1);

        if (!section || !section.isActive) {
            return json([]);
        }

        const items = await db.select()
            .from(menuItems)
            .where(and(
                eq(menuItems.sectionId, sectionCode),
                eq(menuItems.isActive, true)
            ))
            .orderBy(menuItems.model);

        return json(items);
    } catch (error) {
        console.error('[MenuAPI] Erro ao buscar itens:', error);
        return json({ error: 'Erro ao buscar itens do menu' }, { status: 500 });
    }
};
