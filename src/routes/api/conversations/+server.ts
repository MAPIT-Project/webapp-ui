import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ url, cookies }) => {
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

		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found or error fetching user' }, { status: 401 });
		}
		const authUserId = user.id; // This is the UUID

		// Fetch the local client ID (integer) using the authUserId (UUID)
		const { data: clientRecord, error: clientError } = await supabase
			.from('client')
			.select('id')
			.eq('auth_id', authUserId)
			.single();

		if (clientError || !clientRecord) {
			console.error('Error fetching client record or client not found:', clientError);
			return json({ error: 'User profile not found or error fetching profile.' }, { status: 404 });
		}
		const localClientId = clientRecord.id; // This is the integer client ID

		const spaceId = url.searchParams.get('spaceId');

		if (!spaceId) {
			return json({ error: 'spaceId query parameter is required' }, { status: 400 });
		}

		let query = supabase.from('conversation').select('*');

		if (spaceId === 'personal') {
			query = query.eq('user_id', localClientId).is('collaboration_id', null);
		} else {
			// Assuming spaceId is a numeric collaboration_id
			const collaborationIdNum = parseInt(spaceId);
			if (isNaN(collaborationIdNum)) {
				return json({ error: 'Invalid collaboration spaceId' }, { status: 400 });
			}
			query = query.eq('collaboration_id', collaborationIdNum);

			// IMPORTANT: Add a check to ensure the user is part of this collaboration.
			// This might involve a join or a subquery to check a 'collaboration_members' table
			// using localClientId.
			// Example (conceptual, adapt to your schema):
			// const { data: memberCheck, error: memberError } = await supabase
			//     .from('collaboration_members')
			//     .select('id', { count: 'exact' })
			//     .eq('collaboration_id', collaborationIdNum)
			//     .eq('client_id', localClientId); // Use localClientId here
			// if (memberError || memberCheck[0]?.count === 0) {
			//     return json({ error: 'Forbidden: You are not a member of this collaboration space.' }, { status: 403 });
			// }
			// Without this check, a user could potentially list conversations from any collaboration if they know the ID.
		}

		query = query.order('updated_at', { ascending: false });

		const { data: conversations, error } = await query;

		if (error) {
			console.error('Error fetching conversations:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ conversations: conversations || [] });
	} catch (error) {
		console.error('Server error fetching conversations:', error);
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

		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();
		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const authUserId = user.id; // UUID

		// Fetch the local client ID (integer) using the authUserId (UUID)
		const { data: clientRecord, error: clientError } = await supabase
			.from('client')
			.select('id')
			.eq('auth_id', authUserId)
			.single();

		if (clientError || !clientRecord) {
			console.error('Error fetching client record for POST or client not found:', clientError);
			return json({ error: 'User profile not found for creating conversation.' }, { status: 404 });
		}
		const localClientId = clientRecord.id; // Integer client ID

		const { topic, name, firstMessage, spaceId } = await request.json();

		if (!name || !firstMessage) {
			return json({ error: 'Missing required fields: name and firstMessage' }, { status: 400 });
		}

		const collaborationId = spaceId && spaceId !== 'personal' ? parseInt(spaceId) : null;
		if (spaceId && spaceId !== 'personal' && isNaN(collaborationId as number)) {
			return json({ error: 'Invalid spaceId for collaboration' }, { status: 400 });
		}

		// TODO: If collaborationId is provided, verify user (localClientId) is part of that collaboration.

		const { data: newConversation, error: insertError } = await supabase
			.from('conversation')
			.insert({
				user_id: localClientId, // Use the integer localClientId
				topic: topic || 'General',
				name: name,
				collaboration_id: collaborationId
				// last_message_at: new Date().toISOString(), // Consider setting this
			})
			.select()
			.single();

		if (insertError) {
			console.error('Error creating conversation:', insertError);
			return json({ error: insertError.message }, { status: 500 });
		}

		// Optionally, create the first message here if your logic requires it atomically
		// For now, assuming client handles adding the first message via /api/messages

		return json({ conversation: newConversation }, { status: 201 });
	} catch (error) {
		console.error('Error in POST /api/conversations:', error);
		return json({ error: 'Failed to create conversation' }, { status: 500 });
	}
};
