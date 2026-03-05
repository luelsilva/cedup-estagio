import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { courses, courseTeachers, teachers } from '$lib/server/db/schema';
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

        const courseResult = await db.select().from(courses)
            .where(eq(courses.id, id));
        if (courseResult.length === 0) return json({ error: 'Curso não encontrado' }, { status: 404 });

        const course = courseResult[0] as any;

        // Buscar professores vinculados
        const teachersResult = await db.select({
            id: teachers.id,
            name: teachers.name,
            registration: teachers.registration
        })
            .from(courseTeachers)
            .innerJoin(teachers, eq(courseTeachers.teacherId, teachers.id))
            .where(eq(courseTeachers.courseId, id));

        course.teachers = teachersResult;

        return json(course);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar curso' }, { status: 500 });
    }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const { name, sigla, shortName, teacherIds } = await request.json();

        if (!name) return json({ error: 'Nome do curso é obrigatório' }, { status: 400 });
        if (!sigla) return json({ error: 'Sigla do curso é obrigatória' }, { status: 400 });
        if (!shortName) return json({ error: 'Nome curto do curso é obrigatório' }, { status: 400 });

        const result = await db.transaction(async (tx) => {
            // 1. Atualizar curso
            const [updatedCourse] = await tx.update(courses)
                .set({
                    name: formatarNome(name),
                    sigla: sigla.toUpperCase(),
                    shortName: formatarNome(shortName),
                    updatedAt: new Date()
                })
                .where(eq(courses.id, id))
                .returning();

            if (!updatedCourse) throw new Error('COURSE_NOT_FOUND');

            // 2. Atualizar relacionamentos
            if (teacherIds && Array.isArray(teacherIds)) {
                await tx.delete(courseTeachers).where(eq(courseTeachers.courseId, id));
                if (teacherIds.length > 0) {
                    const relations = teacherIds.map(tId => ({
                        courseId: id,
                        teacherId: tId
                    }));
                    await tx.insert(courseTeachers).values(relations);
                }
            }

            return updatedCourse;
        });

        return json(result);
    } catch (error: any) {
        if (error.message === 'COURSE_NOT_FOUND') {
            return json({ error: 'Curso não encontrado' }, { status: 404 });
        }
        if (error.code === '23505') {
            return json({ error: 'Nome ou Sigla do curso já em uso' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao atualizar curso' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const result = await db.delete(courses)
            .where(eq(courses.id, id))
            .returning();

        if (result.length === 0) return json({ error: 'Curso não encontrado' }, { status: 404 });
        return json({ message: 'Curso removido com sucesso' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar curso' }, { status: 500 });
    }
};
