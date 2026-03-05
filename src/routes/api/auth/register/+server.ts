import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, otpCodes } from '$lib/server/db/schema';
import { isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateOTP } from '$lib/server/auth/otpGenerator';
import { emailService } from '$lib/server/services/emailService';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, full_name, role } = await request.json();

        // 1. Normalização e Hash da senha
        const normalizedEmail = email.toLowerCase();
        const formattedFullName = formatarNome(full_name);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Se for empresa, já cria verificada
        const isCompany = role === 'company';

        // 2. Criar perfil
        const [user] = await db.insert(profiles)
            .values({
                email: normalizedEmail,
                passwordHash: hashedPassword,
                fullName: formattedFullName,
                isVerified: isCompany, // Se for empresa, is_verified = true
                roles: role || 'generic'
            })
            .returning();

        // Se for empresa, não gera OTP e nem envia e-mail de ativação
        if (isCompany) {
            return json(
                {
                    message: 'Conta de empresa criada com sucesso!',
                    userId: user.id,
                    isVerified: true
                },
                { status: 201 }
            );
        }

        // 3. Gerar e salvar OTP (Apenas para usuários comuns)
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos hardcoded ou via config

        await db.insert(otpCodes).values({
            userId: user.id,
            code: otp,
            type: 'registration',
            expiresAt
        });

        // 4. Enviar e-mail real via Resend
        const emailResult = await emailService.sendOTPEmail(email, otp, full_name);

        if (!emailResult.success) {
            console.warn('[AUTH] Falha ao enviar e-mail:', emailResult.error);
        }

        return json(
            {
                message: 'Usuário registrado. Verifique seu e-mail para ativar a conta.',
                userId: user.id
            },
            { status: 201 }
        );

    } catch (error: any) {
        // Erro de email duplicado (constraint unique)
        // Drizzle pode encapsular o erro do driver no .cause
        const errorCode = error.code || (error.cause && error.cause.code);

        if (errorCode === '23505') {
            return json({ error: 'Email já cadastrado' }, { status: 400 });
        }

        console.error(error);
        return json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
};
