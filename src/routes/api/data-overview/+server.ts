import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createBackendAccessToken } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ locals, url, fetch }) => {
	// hooks.server validates this user with Supabase getUser().
	if (!locals.user)
		return json({ error: 'Please sign in to view the data overview.' }, { status: 401 });
	try {
		const token = await createBackendAccessToken({ userId: locals.user.id, roles: ['viewer'] });
		const refresh = url.searchParams.get('refresh') === '1' ? '?refresh=true' : '';
		const upstream = await fetch(
			`${env.BACKEND_URL || 'http://localhost:18000'}/api/data-overview${refresh}`,
			{
				headers: { Authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(20000)
			}
		);
		if (!upstream.ok) throw new Error('Data source unavailable');
		return json(await upstream.json(), { headers: { 'Cache-Control': 'private, no-store' } });
	} catch {
		return json(
			{ error: 'The data overview could not be loaded. Please try refreshing.' },
			{ status: 503 }
		);
	}
};
