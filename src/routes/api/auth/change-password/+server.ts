import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();
        const userId = locals.user.id;

        // 1. Buscar usuário
        const [user] = await db.select()
            .from(profiles)
            .where(and(eq(profiles.id, userId), isNull(profiles.deletedAt)))
            .limit(1);

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // 2. Verificar senha atual
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return json({ error: 'Senha atual incorreta' }, { status: 400 });
        }

        // 3. Hash da nova senha
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 4. Atualizar senha e resetar flag
        await db.update(profiles)
            .set({
                passwordHash: hashedNewPassword,
                mustChangePassword: false,
                updatedAt: new Date()
            })
            .where(eq(profiles.id, userId));

        return json({ message: 'Senha alterada com sucesso!' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao alterar senha' }, { status: 500 });
    }
};
