import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, otpCodes } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateOTP } from '$lib/server/auth/otpGenerator';
import { emailService } from '$lib/server/services/emailService';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email } = await request.json();

        // 1. Buscar usuário
        const [user] = await db.select({
            id: profiles.id,
            fullName: profiles.fullName,
            isVerified: profiles.isVerified
        })
            .from(profiles)
            .where(and(eq(profiles.email, email), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            // Retornamos sucesso fictício para evitar enumeração
            return json(
                { message: 'Se o cadastro existir e não estiver verificado, um novo código será enviado.' },
                { status: 200 }
            );
        }

        if (user.isVerified) {
            return json({ error: 'Conta já está verificada' }, { status: 400 });
        }

        const message = 'Se o cadastro existir e não estiver verificado, um novo código será enviado.';

        // 2. Gerar novo OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // 3. Deletar códigos antigos e inserir novo
        await db.delete(otpCodes)
            .where(
                and(
                    eq(otpCodes.userId, user.id),
                    eq(otpCodes.type, 'registration')
                )
            );

        await db.insert(otpCodes).values({
            userId: user.id,
            code: otp,
            type: 'registration',
            expiresAt
        });

        // 4. Enviar e-mail real via Resend
        const emailResult = await emailService.sendOTPEmail(email, otp, user.fullName || 'Usuário');

        if (!emailResult.success) {
            console.warn('[AUTH] Falha ao reenviar e-mail:', emailResult.error);
            return json({ error: 'Falha ao enviar e-mail de verificação' }, { status: 500 });
        }

        return json({ message }, { status: 200 });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao reenviar código' }, { status: 500 });
    }
};
