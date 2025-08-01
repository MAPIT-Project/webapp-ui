import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				get: (key: string) => cookies.get(key),
				set: (key: string, value: string, options: any) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key: string, options: any) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		});

		// Get auth session
		const { data: authData, error: authError } = await supabase.auth.getSession();

		if (authError) {
			return json({ error: 'Auth error', details: authError.message }, { status: 500 });
		}

		if (!authData.session) {
			return json({ error: 'No active session' }, { status: 401 });
		}

		const userId = authData.session.user.id;
		const userEmail = authData.session.user.email;

		if (!userEmail) {
			return json({ error: 'User email not found' }, { status: 400 });
		}

		// 1. Check if client exists by auth_id
		const { data: clientByAuthId, error: authIdError } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		// 2. Check if client exists by email
		const { data: clientByEmail, error: emailError } = await supabase
			.from('client')
			.select('*')
			.eq('email', userEmail)
			.maybeSingle();

		// If client exists by email but has different auth_id, fix it
		if (clientByEmail && !clientByAuthId) {
			const { data: updatedClient, error: updateError } = await supabase
				.from('client')
				.update({ auth_id: userId })
				.eq('id', clientByEmail.id)
				.select()
				.single();

			if (updateError) {
				return json(
					{
						error: 'Failed to update client',
						details: updateError.message,
						fix: 'manual',
						checkResults: { clientByAuthId, clientByEmail }
					},
					{ status: 500 }
				);
			}

			return json({
				success: true,
				message: 'Client record updated successfully',
				client: updatedClient
			});
		}

		// If client exists by both methods, everything is fine
		if (clientByAuthId) {
			return json({
				success: true,
				message: 'Client record already properly configured',
				client: clientByAuthId
			});
		}

		// If no client exists, create one
		if (!clientByEmail && !clientByAuthId) {
			const defaultName = userEmail.split('@')[0];

			const { data: newClient, error: insertError } = await supabase
				.from('client')
				.insert([
					{
						auth_id: userId,
						email: userEmail,
						first_name: defaultName,
						last_name: 'User',
						password: 'password_not_used'
					}
				])
				.select()
				.single();

			if (insertError) {
				return json(
					{
						error: 'Failed to create client',
						details: insertError.message,
						fix: 'manual',
						checkResults: { clientByAuthId, clientByEmail }
					},
					{ status: 500 }
				);
			}

			return json({
				success: true,
				message: 'Client record created successfully',
				client: newClient
			});
		}

		return json(
			{
				error: 'Unexpected state',
				checkResults: { clientByAuthId, clientByEmail }
			},
			{ status: 500 }
		);
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
