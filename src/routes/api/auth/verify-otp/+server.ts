import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, otpCodes } from '$lib/server/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { generateOTP } from '$lib/server/auth/otpGenerator';
import { emailService } from '$lib/server/services/emailService';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, code } = await request.json();

        // 1. Buscar usuário
        const [user] = await db.select({ id: profiles.id })
            .from(profiles)
            .where(and(eq(profiles.email, email), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Código inválido ou expirado' }, { status: 400 });
        }

        // 2. Buscar código válido no banco
        const [otpData] = await db.select()
            .from(otpCodes)
            .where(
                and(
                    eq(otpCodes.userId, user.id),
                    eq(otpCodes.code, code),
                    eq(otpCodes.type, 'registration'),
                    gt(otpCodes.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!otpData) {
            return json({ error: 'Código inválido ou expirado' }, { status: 400 });
        }

        // 3. Ativar conta
        await db.update(profiles)
            .set({ isVerified: true })
            .where(eq(profiles.id, user.id));

        // 4. Deletar código usado
        await db.delete(otpCodes)
            .where(eq(otpCodes.id, otpData.id));

        return json({ message: 'Conta verificada com sucesso!' });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao verificar código' }, { status: 500 });
    }
};
