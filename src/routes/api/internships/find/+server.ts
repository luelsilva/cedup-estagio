import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { internships } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const registration = url.searchParams.get('registration');
        const cnpj = url.searchParams.get('cnpj');

        if (!registration || !cnpj) {
            return json({ error: 'Parâmetros registration e cnpj são obrigatórios' }, { status: 400 });
        }

        const result = await db.select({ id: internships.id })
            .from(internships)
            .where(and(
                eq(internships.studentRegistration, Number(registration)),
                eq(internships.companyCnpj, cnpj),
                isNull(internships.deletedAt)
            ))
            .limit(1);

        if (result.length === 0) {
            return json({ error: 'Estágio não encontrado com os dados fornecidos' }, { status: 404 });
        }

        return json({ id: result[0].id });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar estágio' }, { status: 500 });
    }
};
