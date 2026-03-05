import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Atualizar seção
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        const { code, caption, colorDark, colorLight, isActive } = await request.json();

        const [updatedSection] = await db.update(menuSections)
            .set({
                code,
                caption,
                colorDark,
                colorLight,
                isActive,
                updatedAt: new Date()
            })
            .where(eq(menuSections.id, id as string))
            .returning();

        if (!updatedSection) {
            return json({ error: 'Seção não encontrada' }, { status: 404 });
        }

        return json(updatedSection);
    } catch (error: any) {
        console.error('[AdminMenuAPI] Erro ao atualizar seção:', error);
        if (error.code === '23505') {
            return json({ error: 'Código de seção já existe' }, { status: 409 });
        }
        return json({ error: 'Erro ao atualizar seção' }, { status: 500 });
    }
};

// Deletar seção
export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;

        const [deletedSection] = await db.delete(menuSections)
            .where(eq(menuSections.id, id as string))
            .returning();

        if (!deletedSection) {
            return json({ error: 'Seção não encontrada' }, { status: 404 });
        }

        return json({ message: 'Seção deletada com sucesso', section: deletedSection });
    } catch (error) {
        console.error('[AdminMenuAPI] Erro ao deletar seção:', error);
        return json({ error: 'Erro ao deletar seção' }, { status: 500 });
    }
};
