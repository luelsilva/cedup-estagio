import { json } from '@sveltejs/kit';
import { revokeRefreshToken } from '$lib/server/auth/tokenManager';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { refreshToken } = await request.json();

        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }

        return json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Erro ao fazer logout' }, { status: 500 });
    }
};
