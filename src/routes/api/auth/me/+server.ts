import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const userId = locals.user.id;

        const [user] = await db.select({
            id: profiles.id,
            email: profiles.email,
            name: profiles.fullName,
            roles: profiles.roles,
            mustChangePassword: profiles.mustChangePassword
        })
            .from(profiles)
            .where(and(eq(profiles.id, userId), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return json({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            mustChangePassword: !!user.mustChangePassword
        });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar perfil' }, { status: 500 });
    }
};
