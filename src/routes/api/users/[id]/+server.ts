import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

// Buscar usuário
export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const [user] = await db.select({
            id: profiles.id,
            email: profiles.email,
            fullName: profiles.fullName,
            roles: profiles.roles,
            isVerified: profiles.isVerified,
            mustChangePassword: profiles.mustChangePassword,
            createdAt: profiles.createdAt,
            updatedAt: profiles.updatedAt
        })
            .from(profiles)
            .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)));

        if (!user) {
            return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return json(user);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }
};

// Atualizar usuário
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const { email, password, fullName, roles, isVerified, mustChangePassword } = await request.json();

        const updateData: any = { updatedAt: new Date() };

        if (email) updateData.email = email.toLowerCase();
        if (fullName) updateData.fullName = formatarNome(fullName);
        if (roles) updateData.roles = roles;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (mustChangePassword !== undefined) updateData.mustChangePassword = mustChangePassword;

        if (password && password.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const [updatedUser] = await db.update(profiles)
            .set(updateData)
            .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
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
    } catch (error: any) {
        if (error.code === '23505') {
            return json({ error: 'Email já cadastrado' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
};

// Deletar usuário (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = params;
        if (!id) return json({ error: 'ID é obrigatório' }, { status: 400 });

        const [deletedUser] = await db.update(profiles)
            .set({ deletedAt: new Date() })
            .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
            .returning();

        if (!deletedUser) {
            return json({ error: 'Usuário não encontrado ou já removido' }, { status: 404 });
        }

        return json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao deletar usuário' }, { status: 500 });
    }
};
