import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        const { fullName, roles, isVerified, mustChangePassword, password } = await request.json();

        const updateData: any = {
            fullName: formatarNome(fullName),
            roles,
            isVerified,
            mustChangePassword,
            updatedAt: new Date()
        };

        if (password && password.trim().length > 0) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const [updatedUser] = await db.update(profiles)
            .set(updateData)
            .where(eq(profiles.id, id as string))
            .returning({
                id: profiles.id,
                email: profiles.email,
                fullName: profiles.fullName,
                roles: profiles.roles,
                isVerified: profiles.isVerified,
                mustChangePassword: profiles.mustChangePassword
            });

        if (!updatedUser) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return json(updatedUser);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;

        if (locals.user.id === id) {
            return json({ error: 'Você não pode deletar sua própria conta via painel administrativo.' }, { status: 400 });
        }

        // 1. Obter e-mail atual
        const [user] = await db.select({ email: profiles.email })
            .from(profiles)
            .where(eq(profiles.id, id as string))
            .limit(1);

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // 2. Soft delete
        const timestamp = Date.now();
        const newEmail = `${user.email}_deleted_${timestamp}`;

        await db.update(profiles)
            .set({
                deletedAt: new Date(),
                email: newEmail
            })
            .where(eq(profiles.id, id as string));

        return json({ message: 'Usuário removido com sucesso (soft delete)' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar usuário' }, { status: 500 });
    }
};
