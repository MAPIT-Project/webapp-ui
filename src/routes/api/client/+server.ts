import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ cookies }) => {
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

		const { data: authData } = await supabase.auth.getSession();

		if (!authData.session?.user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		const userId = authData.session.user.id;

		const { data, error } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		if (error) {
			console.error('Error fetching client:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ client: data });
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

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { firstName, lastName } = await request.json();

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

		const { data: authData } = await supabase.auth.getSession();

		if (!authData.session?.user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		const userId = authData.session.user.id;
		const userEmail = authData.session.user.email;

		if (!userEmail) {
			return json({ error: 'User email not found' }, { status: 400 });
		}

		// First check if client exists by auth_id
		const { data: existingClient } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		if (existingClient) {
			return json({ client: existingClient });
		}

		// Check by email and update if needed
		const { data: clientByEmail } = await supabase
			.from('client')
			.select('*')
			.eq('email', userEmail)
			.maybeSingle();

		if (clientByEmail) {
			const updateData: any = { auth_id: userId };
			if (firstName) updateData.first_name = firstName;
			if (lastName) updateData.last_name = lastName;

			const { data: updatedClient, error: updateError } = await supabase
				.from('client')
				.update(updateData)
				.eq('id', clientByEmail.id)
				.select()
				.single();

			if (updateError) {
				return json({ error: updateError.message }, { status: 500 });
			}

			return json({ client: updatedClient });
		}

		// Create new client
		const { data: newClient, error: insertError } = await supabase
			.from('client')
			.insert([
				{
					auth_id: userId,
					email: userEmail,
					first_name: firstName || userEmail.split('@')[0] || 'New',
					last_name: lastName || 'User',
					password: 'password_not_used'
				}
			])
			.select()
			.single();

		if (insertError) {
			return json({ error: insertError.message }, { status: 500 });
		}

		return json({ client: newClient });
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
