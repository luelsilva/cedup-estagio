import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { menuSections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Listar todas as seções
export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const results = await db.select()
            .from(menuSections)
            .orderBy(menuSections.code);
        return json(results);
    } catch (error) {
        console.error('[AdminMenuAPI] Erro ao listar seções:', error);
        return json({ error: 'Erro ao listar seções' }, { status: 500 });
    }
};

// Criar nova seção
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { code, caption, colorDark, colorLight, isActive } = await request.json();

        const active = isActive !== undefined ? isActive : true;

        const [newSection] = await db.insert(menuSections)
            .values({
                code,
                caption,
                colorDark,
                colorLight,
                isActive: active
            })
            .returning();

        return json(newSection, { status: 201 });
    } catch (error: any) {
        console.error('[AdminMenuAPI] Erro ao criar seção:', error);
        if (error.code === '23505') {
            return json({ error: 'Código de seção já existe' }, { status: 409 });
        }
        return json({ error: 'Erro ao criar seção' }, { status: 500 });
    }
};
