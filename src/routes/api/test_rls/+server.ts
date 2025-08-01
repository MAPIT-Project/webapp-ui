import type { RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/clients/supabaseClient';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	// Get the auth token from the request headers
	const authHeader = request.headers.get('authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ error: 'No authorization token provided' }, { status: 401 });
	}

	const token = authHeader.split(' ')[1];

	try {
		// Don't try to set the session directly with setSession
		// Instead, create a new supabase client with the auth header
		const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/client`, {
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				return json({ error: 'Authentication failed - invalid token' }, { status: 401 });
			}
			return json(
				{
					error: `Failed to retrieve client data: ${response.status}`,
					details: await response.text()
				},
				{ status: response.status }
			);
		}

		const clientData = await response.json();

		// Get user information
		const userResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
			}
		});

		if (!userResponse.ok) {
			return json({
				message: 'RLS test partially successful',
				client: clientData,
				user: 'Unable to retrieve user details'
			});
		}

		const userData = await userResponse.json();

		return json({
			message: 'RLS test successful',
			user: {
				id: userData.id,
				email: userData.email
			},
			client: clientData
		});
	} catch (error) {
		console.error('Error in test_rls endpoint:', error);
		return json(
			{
				error: 'An error occurred during the RLS test',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
