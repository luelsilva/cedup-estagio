import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { formModels } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const result = await db.select()
            .from(formModels)
            .orderBy(asc(formModels.modelId));
        return json(result);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar formulários' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { modelId, title, description, bgColor, cardBgColor, titleColor, googleDocsId, config, isActive } = body;

        const [newForm] = await db.insert(formModels)
            .values({ modelId, title, description, bgColor, cardBgColor, titleColor, googleDocsId, config, isActive })
            .returning();

        return json(newForm, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return json({ error: 'Model ID já existe' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao criar formulário' }, { status: 500 });
    }
};
