import type { RequestHandler } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		// Create server-side Supabase client
		const supabase = createSupabaseServerClient(cookies);

		// Sign out on server side
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error('Logout error:', error.message);
			return json({ error: error.message }, { status: 400 });
		}

		return json({
			success: true,
			message: 'Logged out successfully'
		});
	} catch (error) {
		console.error('Server error during logout:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
