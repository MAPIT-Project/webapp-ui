import type { RequestHandler } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { json } from '@sveltejs/kit';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { createServerClient } from '@supabase/ssr';

const SERVER_SUPABASE_URL = env.PRIVATE_SUPABASE_URL || 'http://localhost:54321';

export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const collaborationId = parseInt(params.id || '');

		if (!collaborationId || isNaN(collaborationId)) {
			return json({ error: 'Invalid collaboration ID' }, { status: 400 });
		}

		const supabase = createSupabaseServerClient(cookies);

		// Create admin client for database queries
		const adminSupabase = createServerClient(SERVER_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
			cookies: {
				getAll() {
					return [];
				},
				setAll() {
					// Admin client doesn't need to set cookies
				}
			}
		});

		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Get the current user's client record
		const { data: currentClient, error: currentClientError } = await adminSupabase
			.from('client')
			.select('id')
			.eq('auth_id', user.id)
			.single();

		if (currentClientError || !currentClient) {
			return json({ error: 'User profile not found' }, { status: 404 });
		}

		// Check if current user is a member of this collaboration
		const { data: membership, error: membershipError } = await adminSupabase
			.from('client_collaboration')
			.select('role')
			.eq('collaboration_id', collaborationId)
			.eq('client_id', currentClient.id)
			.single();

		if (membershipError || !membership) {
			return json({ error: 'You are not a member of this collaboration' }, { status: 403 });
		}

		// Get all members of the collaboration
		const { data: members, error: membersError } = await adminSupabase
			.from('client_collaboration')
			.select(
				`
                role,
                created_at,
                client:client(id, email, first_name, last_name)
            `
			)
			.eq('collaboration_id', collaborationId)
			.order('created_at', { ascending: true });

		if (membersError) {
			console.error('Error fetching collaboration members:', membersError);
			return json({ error: 'Failed to fetch collaboration members' }, { status: 500 });
		}

		// Format the response
		const formattedMembers = members.map((member: any) => ({
			id: member.client?.id,
			email: member.client?.email,
			firstName: member.client?.first_name,
			lastName: member.client?.last_name,
			name: `${member.client?.first_name || ''} ${member.client?.last_name || ''}`.trim(),
			role: member.role,
			joinedAt: member.created_at,
			avatar: `https://i.pravatar.cc/150?u=${member.client?.email || ''}` // Generate avatar from email
		}));

		return json({ members: formattedMembers });
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
