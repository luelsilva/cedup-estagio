import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, otpCodes } from '$lib/server/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, code, newPassword } = await request.json();

        // 1. Buscar usuário
        const [user] = await db.select({ id: profiles.id })
            .from(profiles)
            .where(and(eq(profiles.email, email), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // 2. Verificar código de reset
        const [otpData] = await db.select()
            .from(otpCodes)
            .where(
                and(
                    eq(otpCodes.userId, user.id),
                    eq(otpCodes.code, code),
                    eq(otpCodes.type, 'password_reset'),
                    gt(otpCodes.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!otpData) {
            return json({ error: 'Código inválido ou expirado' }, { status: 400 });
        }

        // 3. Hash da nova senha e atualização
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(profiles)
            .set({ passwordHash: hashedPassword })
            .where(eq(profiles.id, user.id));

        // 4. Limpar código usado
        await db.delete(otpCodes)
            .where(eq(otpCodes.id, otpData.id));

        return json({ message: 'Senha alterada com sucesso!' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao resetar senha' }, { status: 500 });
    }
};
