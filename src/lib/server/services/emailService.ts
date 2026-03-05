import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);
const EMAIL_FROM = env.EMAIL_FROM || 'GetMais <noreply@updates.getmais.com.br>';

export const emailService = {
    /**
     * Envia o código OTP via e-mail utilizando Resend.
     * @param to - E-mail do destinatário
     * @param otpCode - Código de 6 dígitos
     * @param userName - Nome do usuário (opcional)
     */
    sendOTPEmail: async (to: string, otpCode: string, userName: string = 'Usuário') => {
        try {
            if (!env.RESEND_API_KEY) {
                console.warn('[EMAIL SERVICE] RESEND_API_KEY não configurada. Simulando envio...');
                console.log(`[SIMULAÇÃO] Para: ${to}, Código: ${otpCode}`);
                return { success: true, simulated: true };
            }

            const { data, error } = await resend.emails.send({
                from: EMAIL_FROM,
                to: to,
                subject: `${otpCode} é o seu código de verificação`,
                html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e1e1e1; border-radius: 12px;">
            <h1 style="color: #6366f1; font-size: 24px; margin-bottom: 20px;">Olá, ${userName}!</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
              Este é o seu código de verificação para ativar sua conta na plataforma.
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este código expira em 10 minutos. Se você não solicitou este código, ignore este e-mail.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              &copy; 2026 Plataforma de Estágios. Todos os direitos reservados.
            </p>
          </div>
        `,
            });

            if (error) {
                console.error('[EMAIL SERVICE ERROR]', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('[EMAIL ERROR]', err);
            return { success: false, error: err };
        }
    },
};
