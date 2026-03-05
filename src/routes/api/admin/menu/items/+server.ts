import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Listar itens
export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const sectionId = url.searchParams.get('sectionId');
        let query = db.select().from(menuItems);

        if (sectionId) {
            query = query.where(eq(menuItems.sectionId, parseInt(sectionId))) as any;
        }

        const results = await (query as any).orderBy(menuItems.model);
        return json(results);
    } catch (error) {
        console.error('[AdminMenuAPI] Erro ao listar itens:', error);
        return json({ error: 'Erro ao listar itens' }, { status: 500 });
    }
};

// Criar novo item
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { sectionId, model, caption, link, isActive } = await request.json();

        const [newItem] = await db.insert(menuItems)
            .values({
                sectionId,
                model,
                caption,
                link,
                isActive: isActive !== undefined ? isActive : true
            })
            .returning();

        return json(newItem, { status: 201 });
    } catch (error: any) {
        console.error('[AdminMenuAPI] Erro ao criar item:', error);
        if (error.code === '23505') {
            return json({ error: 'Modelo do item já existe' }, { status: 409 });
        }
        return json({ error: 'Erro ao criar item' }, { status: 500 });
    }
};
