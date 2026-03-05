import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '$lib/server/auth/tokenManager';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, full_name } = await request.json();
        const normalizedEmail = email.toLowerCase();

        // 1. Buscar usuário
        let [user] = await db.select()
            .from(profiles)
            .where(and(eq(profiles.email, normalizedEmail), isNull(profiles.deletedAt)))
            .limit(1);

        if (user) {
            // 2. Se existe, verificar senha
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return json({
                    error: 'Este e-mail já está em uso com uma senha diferente. Por favor, use a senha cadastrada ou recupere seu acesso.'
                }, { status: 401 });
            }

            // Forçar verificação se for empresa entrando pela primeira vez por este fluxo
            if (!user.isVerified) {
                await db.update(profiles).set({ isVerified: true }).where(eq(profiles.id, user.id));
                user.isVerified = true;
            }
        } else {
            // 3. Se não existe, registrar como empresa e já verificado
            const formattedFullName = formatarNome(full_name);
            const hashedPassword = await bcrypt.hash(password, 10);

            [user] = await db.insert(profiles)
                .values({
                    email: normalizedEmail,
                    passwordHash: hashedPassword,
                    fullName: formattedFullName,
                    isVerified: true,
                    roles: 'company'
                })
                .returning();
        }

        // 4. Gerar tokens de acesso (com rememberMe default para empresas = true)
        const accessToken = generateAccessToken(user.id, user.email, user.roles);
        const refreshToken = await generateRefreshToken(user.id, true);

        return json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.fullName,
                roles: user.roles,
                mustChangePassword: !!user.mustChangePassword
            }
        });

    } catch (error) {
        console.error('[AUTH] Erro no login/registro de empresa:', error);
        return json({ error: 'Erro ao processar identificação da empresa' }, { status: 500 });
    }
};
