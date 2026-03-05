import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { teachers } from '$lib/server/db/schema';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const result = await db.select().from(teachers)
            .orderBy(teachers.name);
        return json(result);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar professores' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { registration, name, email } = await request.json();
        if (!registration || !name || !email) {
            return json({ error: 'Matrícula, nome e email são obrigatórios' }, { status: 400 });
        }

        const result = await db.insert(teachers)
            .values({
                registration,
                name: formatarNome(name),
                email: email.toLowerCase()
            })
            .returning();

        return json(result[0], { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            if (error.detail && error.detail.includes('registration')) return json({ error: 'Matrícula já cadastrada' }, { status: 400 });
            if (error.detail && error.detail.includes('email')) return json({ error: 'Email já cadastrado' }, { status: 400 });
            return json({ error: 'Dados duplicados' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao criar professor' }, { status: 500 });
    }
};
