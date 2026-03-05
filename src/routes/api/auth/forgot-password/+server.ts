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

        // 1. Verificar se usuário existe
        const [user] = await db.select({
            id: profiles.id,
            fullName: profiles.fullName
        })
            .from(profiles)
            .where(and(eq(profiles.email, email), isNull(profiles.deletedAt)))
            .limit(1);

        // Por segurança, não informamos se o email existe ou não
        if (!user) {
            return json(
                { message: 'Se o cadastro existir, enviaremos um código de recuperação.' },
                { status: 200 }
            );
        }

        // 2. Gerar OTP de reset
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // 3. Deletar códigos antigos e salvar novo OTP do tipo 'password_reset'
        await db.delete(otpCodes)
            .where(
                and(
                    eq(otpCodes.userId, user.id),
                    eq(otpCodes.type, 'password_reset')
                )
            );

        await db.insert(otpCodes).values({
            userId: user.id,
            code: otp,
            type: 'password_reset',
            expiresAt
        });

        // 4. Enviar e-mail
        await emailService.sendOTPEmail(email, otp, user.fullName || 'Usuário');

        return json({ message: 'Código de recuperação enviado para o seu e-mail.' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao processar solicitação de senha' }, { status: 500 });
    }
};
