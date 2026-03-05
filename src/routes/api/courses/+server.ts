import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { courses, courseTeachers, teachers } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const allCourses = await db.select().from(courses)
            .orderBy(courses.name);

        if (allCourses.length === 0) {
            return json([]);
        }

        const courseIds = allCourses.map(c => c.id);

        // Buscar professores vinculados
        const relations = await db.select({
            courseId: courseTeachers.courseId,
            teacherId: teachers.id,
            name: teachers.name,
            registration: teachers.registration,
            email: teachers.email
        })
            .from(courseTeachers)
            .innerJoin(teachers, eq(courseTeachers.teacherId, teachers.id))
            .where(inArray(courseTeachers.courseId, courseIds));

        // Agrupar professores por curso
        const coursesWithTeachers = allCourses.map(course => {
            const courseRelations = relations.filter(r => r.courseId === course.id);
            return {
                ...course,
                teachers: courseRelations.map(r => ({
                    id: r.teacherId,
                    name: r.name,
                    registration: r.registration,
                    email: r.email
                }))
            };
        });

        return json(coursesWithTeachers);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar cursos' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, sigla, shortName, teacherIds } = await request.json();
        if (!name) return json({ error: 'Nome do curso é obrigatório' }, { status: 400 });
        if (!sigla) return json({ error: 'Sigla do curso é obrigatória' }, { status: 400 });
        if (!shortName) return json({ error: 'Nome curto do curso é obrigatório' }, { status: 400 });

        const result = await db.transaction(async (tx) => {
            // 1. Criar curso
            const [course] = await tx.insert(courses).values({
                name: formatarNome(name),
                sigla: sigla.toUpperCase(),
                shortName: formatarNome(shortName)
            }).returning();

            // 2. Vincular professores
            if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
                const relations = teacherIds.map(tId => ({
                    courseId: course.id,
                    teacherId: tId
                }));
                await tx.insert(courseTeachers).values(relations);
            }
            return course;
        });

        return json(result, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return json({ error: 'Curso ou Sigla já cadastrado' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao criar curso' }, { status: 500 });
    }
};
