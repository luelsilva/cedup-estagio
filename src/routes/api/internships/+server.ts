import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { internships } from '$lib/server/db/schema';
import { eq, desc, asc, or, ilike, sql, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Listar todos os estágios com suporte a busca e paginação
export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const page = url.searchParams.get('page');
        const limit = url.searchParams.get('limit');
        const search = url.searchParams.get('search');

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

        const baseFilter = isNull(internships.deletedAt);
        let whereClause = baseFilter;

        // Se houver busca
        if (search) {
            const searchTerm = `%${search}%`;
            whereClause = and(
                baseFilter,
                or(
                    ilike(internships.studentName, searchTerm),
                    ilike(internships.companyName, searchTerm),
                    ilike(internships.companyCnpj, searchTerm),
                    sql`${internships.studentRegistration}::text ILIKE ${searchTerm}`
                )
            );
        }

        // Se for company, filtrar apenas os registros que ele é DONO
        if (locals.user.roles === 'company') {
            whereClause = and(
                whereClause,
                eq(internships.userId, locals.user.id)
            );
        }

        let query = db.select(queryFields).from(internships).where(whereClause);
        query = query.orderBy(asc(internships.studentName), desc(internships.createdAt));

        // Paginação
        if (page && limit) {
            const p = parseInt(page);
            const l = parseInt(limit);
            const offset = (p - 1) * l;

            const results = await query.limit(l).offset(offset);

            const [countResult] = await db.select({ count: sql`count(*)` })
                .from(internships)
                .where(whereClause);

            const count = Number(countResult.count);

            return json({
                data: results,
                total: count,
                page: p,
                limit: l
            });
        }

        const allInternships = await query;
        return json(allInternships);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar estágios' }, { status: 500 });
    }
};

// Criar novo estágio
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const {
            studentRegistration,
            studentName,
            courseSigla,
            companyName,
            companyCnpj,
            startDate,
            endDate,
            jsonData
        } = await request.json();

        // Validações básicas
        if (!studentName) return json({ error: 'Nome do aluno é obrigatório' }, { status: 400 });
        if (!courseSigla) return json({ error: 'Sigla do curso é obrigatória' }, { status: 400 });
        if (!companyName) return json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
        if (!companyCnpj) return json({ error: 'CNPJ da empresa é obrigatório' }, { status: 400 });

        const [newInternship] = await db.insert(internships).values({
            userId: locals.user.id,
            studentRegistration,
            studentName,
            courseSigla,
            companyName,
            companyCnpj,
            startDate: startDate || null,
            endDate: endDate || null,
            jsonData,
            lastModifiedBy: locals.user.id
        }).returning();

        return json(newInternship, { status: 201 });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao criar estágio' }, { status: 500 });
    }
};
