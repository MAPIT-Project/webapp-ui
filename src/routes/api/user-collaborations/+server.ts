import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		const authId = user.id;

		// 1. Get the client_id from the auth_id
		const { data: clientRecord, error: clientError } = await supabase
			.from('client')
			.select('id')
			.eq('auth_id', authId)
			.single();

		if (clientError || !clientRecord) {
			console.warn(`No client record found for authId: ${authId}`);
			return json([]); // Return empty array if no client profile found
		}

		const clientId = clientRecord.id;

		// 2. Get collaboration_ids for this client and join with collaboration details
		const { data: collaborations, error: collaborationsError } = await supabase
			.from('client_collaboration')
			.select(
				`
                collaboration:collaboration_id (
                    id,
                    name
                )
            `
			)
			.eq('client_id', clientId);

		if (collaborationsError) {
			console.error('Error fetching collaborations:', collaborationsError);
			return json({ error: 'Failed to fetch collaborations' }, { status: 500 });
		}

		if (!collaborations || collaborations.length === 0) {
			return json([]); // No collaborations for this user
		}

		// Format for the frontend (ensure id is a string for consistency with 'personal' space)
		const formattedCollaborations = collaborations
			.filter((c) => c.collaboration) // Filter out any null collaborations
			.map((c) => ({
				id: String((c.collaboration as any).id), // Convert numeric ID to string
				name: (c.collaboration as any).name
			}));

		return json(formattedCollaborations);
	} catch (error) {
		console.error('Error fetching user collaborations:', error);
		return json({ error: 'Failed to fetch collaborations' }, { status: 500 });
	}
};
