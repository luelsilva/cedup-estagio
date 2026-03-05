import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { validateRefreshToken, generateAccessToken } from '$lib/server/auth/tokenManager';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return json({ error: 'Refresh token não fornecido' }, { status: 401 });
        }

        // Validar refresh token
        const userId = await validateRefreshToken(refreshToken);

        if (!userId) {
            return json({ error: 'Refresh token inválido ou expirado' }, { status: 403 });
        }

        // Buscar dados do usuário
        const [user] = await db.select({
            id: profiles.id,
            email: profiles.email,
            name: profiles.fullName,
            roles: profiles.roles
        })
            .from(profiles)
            .where(and(eq(profiles.id, userId), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Gerar novo access token
        const accessToken = generateAccessToken(user.id, user.email, user.roles);

        return json({
            accessToken,
            user
        });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao renovar token' }, { status: 500 });
    }
};
