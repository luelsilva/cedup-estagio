import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections, menuItems } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const [lastSection] = await db.select({
            updatedAt: menuSections.updatedAt
        })
            .from(menuSections)
            .orderBy(desc(menuSections.updatedAt))
            .limit(1);

        const [lastItem] = await db.select({
            updatedAt: menuItems.updatedAt
        })
            .from(menuItems)
            .orderBy(desc(menuItems.updatedAt))
            .limit(1);

        const [sectionCount] = await db.select({
            count: sql`count(*)`
        }).from(menuSections);

        const [itemCount] = await db.select({
            count: sql`count(*)`
        }).from(menuItems);

        const sectionDate = lastSection?.updatedAt ? new Date(lastSection.updatedAt).getTime() : 0;
        const itemDate = lastItem?.updatedAt ? new Date(lastItem.updatedAt).getTime() : 0;
        const totalCount = (Number(sectionCount?.count) || 0) + (Number(itemCount?.count) || 0);

        const version = `${totalCount}-${Math.max(sectionDate, itemDate)}`;

        return json({ version });
    } catch (error) {
        console.error('[MenuAPI] Erro ao buscar versão:', error);
        return json({ error: 'Erro ao buscar versão do menu' }, { status: 500 });
    }
};
