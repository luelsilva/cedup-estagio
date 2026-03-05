import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq, asc, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { formatarNome } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const result = await db.select({
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
            .where(isNull(profiles.deletedAt))
            .orderBy(asc(profiles.fullName));

        return json(result);
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao buscar usuários' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user || locals.user.roles !== 'sudo') {
            return json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { email, password, fullName, roles, isVerified, mustChangePassword } = await request.json();

        const normalizedEmail = email.toLowerCase();
        const formattedFullName = formatarNome(fullName);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verificar se e-mail existe
        const [existingUser] = await db.select()
            .from(profiles)
            .where(eq(profiles.email, normalizedEmail))
            .limit(1);

        if (existingUser) {
            if (existingUser.deletedAt) {
                return json({ error: 'Este e-mail pertence a um usuário removido. Reative-o ou use outro e-mail.' }, { status: 400 });
            }
            return json({ error: 'Email já cadastrado' }, { status: 400 });
        }

        const [newUser] = await db.insert(profiles)
            .values({
                email: normalizedEmail,
                passwordHash: hashedPassword,
                fullName: formattedFullName,
                roles: roles || 'generic',
                isVerified: isVerified || false,
                mustChangePassword: mustChangePassword || false
            })
            .returning({
                id: profiles.id,
                email: profiles.email,
                fullName: profiles.fullName,
                roles: profiles.roles,
                isVerified: profiles.isVerified,
                mustChangePassword: profiles.mustChangePassword
            });

        return json(newUser, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            return json({ error: 'Email já cadastrado' }, { status: 400 });
        }
        console.error(error);
        return json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }
};
