import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { teachers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const result = await db.select().from(teachers)
            .where(eq(teachers.id, id));
        if (result.length === 0) return json({ error: 'Professor não encontrado' }, { status: 404 });
        return json(result[0]);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar professor' }, { status: 500 });
    }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const { registration, name, email } = await request.json();

        const updateData: any = { updatedAt: new Date() };
        if (registration) updateData.registration = registration;
        if (name) updateData.name = formatarNome(name);
        if (email) updateData.email = email.toLowerCase();

        const result = await db.update(teachers)
            .set(updateData)
            .where(eq(teachers.id, id))
            .returning();

        if (result.length === 0) return json({ error: 'Professor não encontrado' }, { status: 404 });
        return json(result[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            if (error.detail && error.detail.includes('registration')) return json({ error: 'Matrícula já em uso' }, { status: 400 });
            if (error.detail && error.detail.includes('email')) return json({ error: 'Email já em uso' }, { status: 400 });
            return json({ error: 'Dados duplicados' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao atualizar professor' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const result = await db.delete(teachers)
            .where(eq(teachers.id, id))
            .returning();

        if (result.length === 0) return json({ error: 'Professor não encontrado' }, { status: 404 });
        return json({ message: 'Professor removido com sucesso' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar professor' }, { status: 500 });
    }
};
