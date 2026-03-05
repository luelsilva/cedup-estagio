import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { formModels } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Validação simples de UUID
const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        // Tenta buscar por UUID ou por modelId (slug)
        const result = await db.select()
            .from(formModels)
            .where(
                or(
                    isUUID(id) ? eq(formModels.id, id) : undefined,
                    eq(formModels.modelId, id)
                )
            );

        if (result.length === 0) {
            return json({ error: 'Modelo de formulário não encontrado' }, { status: 404 });
        }

        return json(result[0]);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar formulário' }, { status: 500 });
    }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        if (!id || !isUUID(id)) return json({ error: 'ID UUID válido é obrigatório' }, { status: 400 });

        const body = await request.json();
        const { modelId, title, description, bgColor, cardBgColor, titleColor, googleDocsId, config, isActive } = body;

        const [updated] = await db.update(formModels)
            .set({
                modelId,
                title,
                description,
                bgColor,
                cardBgColor,
                titleColor,
                googleDocsId,
                config,
                isActive,
                updatedAt: new Date()
            })
            .where(eq(formModels.id, id))
            .returning();

        if (!updated) {
            return json({ error: 'Modelo não encontrado' }, { status: 404 });
        }

        return json(updated);
    } catch (error: any) {
        if (error.code === '23505') {
            return json({ error: 'Model ID já existe' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao atualizar formulário' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        if (!id || !isUUID(id)) return json({ error: 'ID UUID válido é obrigatório' }, { status: 400 });

        const [deleted] = await db.delete(formModels)
            .where(eq(formModels.id, id))
            .returning();

        if (!deleted) {
            return json({ error: 'Modelo não encontrado' }, { status: 404 });
        }

        return json({ message: 'Modelo removido com sucesso' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar formulário' }, { status: 500 });
    }
};
