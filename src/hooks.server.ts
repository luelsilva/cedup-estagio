import type { Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
    const authHeader = event.request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(
                token,
                env.JWT_SECRET || 'fallback-secret-para-dev'
            ) as App.Locals['user'];

            event.locals.user = decoded;
        } catch (err) {
            // Se o token falhar (expirado, inválido), removemos locals.user 
            // para que a rota recomece ciclo (401) e o frontend peça Refresh Token
            event.locals.user = undefined;
        }
    }

    return await resolve(event);
};
