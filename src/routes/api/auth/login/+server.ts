import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '$lib/server/auth/tokenManager';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, rememberMe } = await request.json();

        // 1. Buscar usuário
        const [user] = await db.select()
            .from(profiles)
            .where(and(eq(profiles.email, email), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // 2. Verificar se está verificado
        if (!user.isVerified) {
            return json({
                error: 'Por favor, verifique seu e-mail antes de logar',
                verified: false,
                email: user.email
            }, { status: 403 });
        }

        // 3. Comparar senha
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // 4. Gerar Access Token (15 minutos)
        const accessToken = generateAccessToken(user.id, user.email, user.roles);

        // 5. Gerar Refresh Token
        const refreshToken = await generateRefreshToken(user.id, rememberMe);

        return json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.fullName,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword
            }
        });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro no login' }, { status: 500 });
    }
};
