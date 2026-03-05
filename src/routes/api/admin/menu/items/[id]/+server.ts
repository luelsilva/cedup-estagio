import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Atualizar item
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        const { sectionId, model, caption, link, isActive } = await request.json();

        const [updatedItem] = await db.update(menuItems)
            .set({
                sectionId,
                model,
                caption,
                link,
                isActive,
                updatedAt: new Date()
            })
            .where(eq(menuItems.id, id as string))
            .returning();

        if (!updatedItem) {
            return json({ error: 'Item não encontrado' }, { status: 404 });
        }

        return json(updatedItem);
    } catch (error: any) {
        console.error('[AdminMenuAPI] Erro ao atualizar item:', error);
        if (error.code === '23505') {
            return json({ error: 'Modelo do item já existe' }, { status: 409 });
        }
        return json({ error: 'Erro ao atualizar item' }, { status: 500 });
    }
};

// Deletar item
export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;

        const [deletedItem] = await db.delete(menuItems)
            .where(eq(menuItems.id, id as string))
            .returning();

        if (!deletedItem) {
            return json({ error: 'Item não encontrado' }, { status: 404 });
        }

        return json({ message: 'Item deletado com sucesso', item: deletedItem });
    } catch (error) {
        console.error('[AdminMenuAPI] Erro ao deletar item:', error);
        return json({ error: 'Erro ao deletar item' }, { status: 500 });
    }
};
