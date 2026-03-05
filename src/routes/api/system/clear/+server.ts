import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { keepAlive } from '$lib/server/db/schema';
import { SYSTEM_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request }) => {
    try {
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey || apiKey !== SYSTEM_API_KEY) {
            return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        await db.delete(keepAlive);

        return json({
            status: 'success',
            message: 'Keep alive table cleared'
        });
    } catch (error) {
        console.error('[KEEP-ALIVE] Clear Error:', error);
        return json({ status: 'error', message: 'Failed to clear keep alive table' }, { status: 500 });
    }
};
