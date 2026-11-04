import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError) {
			return json(
				{
					error: 'Auth error',
					details: userError.message
				},
				{ status: 500 }
			);
		}

		if (!user) {
			return json({ error: 'No active session' }, { status: 401 });
		}

		const userId = user.id;

		// Check if client exists
		const { data: clientData, error: clientError } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId);

		// Try to get RLS info
		const hasClient = clientData && clientData.length > 0;

		return json({
			success: true,
			session: {
				user_id: userId,
				email: user.email
			},
			client: {
				found: hasClient,
				count: clientData?.length || 0,
				data: clientData?.[0] || null
			},
			rls_status: 'Working (server-side)'
		});
	} catch (error) {
		console.error('Server error:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
