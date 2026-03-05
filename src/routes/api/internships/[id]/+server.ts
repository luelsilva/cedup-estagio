import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { internships } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const queryFields = {
            id: internships.id,
            userId: internships.userId,
            studentRegistration: internships.studentRegistration,
            studentName: internships.studentName,
            courseSigla: internships.courseSigla,
            companyName: internships.companyName,
            companyCnpj: internships.companyCnpj,
            startDate: internships.startDate,
            endDate: internships.endDate,
            jsonData: internships.jsonData,
            createdAt: internships.createdAt,
            updatedAt: internships.updatedAt,
            lastModifiedBy: internships.lastModifiedBy,
        };

        const result = await db.select(queryFields)
            .from(internships)
            .where(and(eq(internships.id, id), isNull(internships.deletedAt)));

        if (result.length === 0) {
            return json({ error: 'Estágio não encontrado' }, { status: 404 });
        }

        return json(result[0]);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar estágio' }, { status: 500 });
    }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const body = await request.json();
        const {
            studentRegistration,
            studentName,
            courseSigla,
            companyName,
            companyCnpj,
            startDate,
            endDate,
            jsonData
        } = body;

        const updateSet = {
            studentRegistration,
            studentName,
            courseSigla,
            companyName,
            companyCnpj,
            startDate: startDate || null,
            endDate: endDate || null,
            jsonData,
            updatedAt: new Date(),
            lastModifiedBy: locals.user.id
        };

        const [updatedInternship] = await db.update(internships)
            .set(updateSet)
            .where(and(eq(internships.id, id), isNull(internships.deletedAt)))
            .returning();

        if (!updatedInternship) {
            return json({ error: 'Estágio não encontrado' }, { status: 404 });
        }

        return json(updatedInternship);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao atualizar estágio' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const whereConditions = [eq(internships.id, id), isNull(internships.deletedAt)];

        // Se for company, só pode deletar o dele
        if (locals.user.roles === 'company') {
            whereConditions.push(eq(internships.userId, locals.user.id));
        }

        const [deletedInternship] = await db.update(internships)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
                lastModifiedBy: locals.user.id
            })
            .where(and(...whereConditions))
            .returning();

        if (!deletedInternship) {
            return json({ error: 'Estágio não encontrado ou já deletado' }, { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar estágio' }, { status: 500 });
    }
};
