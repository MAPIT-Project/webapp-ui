import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const collaborationId = url.searchParams.get('id');

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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Get current client
		const userId = user.id;
		const { data: client } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		if (!client) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		if (collaborationId) {
			// Get specific collaboration by ID
			const { data: collaboration, error } = await supabase
				.from('collaboration')
				.select(
					`
                    *,
                    client_collaboration!inner(role)
                `
				)
				.eq('id', collaborationId)
				.eq('client_collaboration.client_id', client.id)
				.single();

			if (error) {
				console.error('Error fetching collaboration:', error);
				return json({ error: error.message }, { status: 500 });
			}

			return json({ collaboration });
		} else {
			// Get all collaborations where user is a member
			const { data: collaborations, error } = await supabase
				.from('collaboration')
				.select(
					`
                    *,
                    client_collaboration!inner(role)
                `
				)
				.eq('client_collaboration.client_id', client.id);

			if (error) {
				console.error('Error fetching collaborations:', error);
				return json({ error: error.message }, { status: 500 });
			}

			// Get member counts for each collaboration
			const collaborationsWithCount = await Promise.all(
				(collaborations || []).map(async (collab) => {
					const { count } = await supabase
						.from('client_collaboration')
						.select('*', { count: 'exact', head: true })
						.eq('collaboration_id', collab.id);

					return {
						...collab,
						collaboratorsCount: count || 1
					};
				})
			);

			return json({ collaborations: collaborationsWithCount });
		}
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
		const { name, description } = await request.json();

		if (!name) {
			return json({ error: 'Collaboration name is required' }, { status: 400 });
		}

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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Get current client
		const userId = user.id;
		const { data: client } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		if (!client) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		// Create collaboration
		const { data: collaboration, error: collaborationError } = await supabase
			.from('collaboration')
			.insert([
				{
					name,
					description
				}
			])
			.select()
			.single();

		if (collaborationError) {
			console.error('Error creating collaboration:', collaborationError);
			return json({ error: collaborationError.message }, { status: 500 });
		}

		// Add creator as owner
		const { error: memberError } = await supabase.from('client_collaboration').insert([
			{
				collaboration_id: collaboration.id,
				client_id: client.id,
				role: 'owner'
			}
		]);

		if (memberError) {
			console.error('Error adding collaboration member:', memberError);
			return json({ error: memberError.message }, { status: 500 });
		}

		return json({ collaboration });
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

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		const collaborationId = url.searchParams.get('id');

		if (!collaborationId) {
			return json({ error: 'Collaboration ID is required' }, { status: 400 });
		}

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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Get current client
		const userId = user.id;
		const { data: client } = await supabase
			.from('client')
			.select('*')
			.eq('auth_id', userId)
			.maybeSingle();

		if (!client) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		// Check if user is owner of the collaboration
		const { data: membership } = await supabase
			.from('client_collaboration')
			.select('role')
			.eq('collaboration_id', collaborationId)
			.eq('client_id', client.id)
			.eq('role', 'owner')
			.maybeSingle();

		if (!membership) {
			return json({ error: 'Collaboration not found or access denied' }, { status: 404 });
		}

		// Delete collaboration (this should cascade to delete members)
		const { error } = await supabase.from('collaboration').delete().eq('id', collaborationId);

		if (error) {
			console.error('Error deleting collaboration:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ success: true });
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
