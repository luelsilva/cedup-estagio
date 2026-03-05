import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections, menuItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const sections = await db.select()
            .from(menuSections)
            .where(eq(menuSections.isActive, true))
            .orderBy(menuSections.code);

        const allItems = await db.select()
            .from(menuItems)
            .where(eq(menuItems.isActive, true))
            .orderBy(menuItems.model);

        // Merge items into sections
        const fullMenu = sections.map(section => ({
            ...section,
            items: allItems.filter(item => item.sectionId === section.code)
        }));

        return json(fullMenu);
    } catch (error) {
        console.error('[MenuAPI] Erro no FullMenu:', error);
        return json({ error: 'Erro ao buscar menu completo' }, { status: 500 });
    }
};
