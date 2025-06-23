import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createServerClient } from '@supabase/ssr';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
    try {
        const collaborationId = parseInt(params.id || '');
        
        if (!collaborationId || isNaN(collaborationId)) {
            return json({ error: 'Invalid collaboration ID' }, { status: 400 });
        }

        const { email, role = 'member' } = await request.json();

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return json({ error: 'Valid email address is required' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['owner', 'admin', 'member'];
        if (!validRoles.includes(role)) {
            return json({ error: 'Invalid role. Must be owner, admin, or member' }, { status: 400 });
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

        // Create a separate client for admin operations using service role key
        const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY || PUBLIC_SUPABASE_ANON_KEY;
        
        console.log('Using service role key:', serviceRoleKey === PUBLIC_SUPABASE_ANON_KEY ? 'ANON (limited)' : 'SERVICE_ROLE (admin)');
        
        const adminSupabase = createServerClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
            cookies: {
                get: () => null,
                set: () => {},
                remove: () => {}
            }
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        // Get the current user's client record using admin client
        const { data: currentClient, error: currentClientError } = await adminSupabase
            .from('client')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (currentClientError || !currentClient) {
            return json({ error: 'User profile not found' }, { status: 404 });
        }

        // Check if current user has permission to invite (must be owner or admin)
        const { data: currentMembership, error: membershipError } = await adminSupabase
            .from('client_collaboration')
            .select('role')
            .eq('collaboration_id', collaborationId)
            .eq('client_id', currentClient.id)
            .single();

        if (membershipError || !currentMembership) {
            return json({ error: 'You are not a member of this collaboration' }, { status: 403 });
        }

        if (!['owner', 'admin'].includes(currentMembership.role)) {
            return json({ error: 'You do not have permission to invite members' }, { status: 403 });
        }

        // Try to find the user - first with RPC, then direct query
        let inviteClient = null;
        let inviteClientError = null;

        // Method 1: Try RPC function (if it exists)
        try {
            const { data: rpcResult, error: rpcError } = await adminSupabase
                .rpc('find_client_by_email', { search_email: email.trim() });

            console.log('RPC result:', { rpcResult, rpcError });

            if (rpcResult && rpcResult.length > 0) {
                inviteClient = rpcResult[0];
                console.log('Found user via RPC:', inviteClient);
            }
        } catch (rpcError) {
            console.log('RPC not available:', rpcError);
        }

        // Method 2: If RPC failed, try direct query (may be blocked by RLS)
        if (!inviteClient) {
            try {
                const { data: directResult, error: directError } = await adminSupabase
                    .from('client')
                    .select('id, email, first_name, last_name')
                    .ilike('email', email.trim())
                    .single();

                console.log('Direct query result:', { directResult, directError });

                if (directResult) {
                    inviteClient = directResult;
                }
                inviteClientError = directError;
            } catch (error) {
                console.log('Direct query failed:', error);
                inviteClientError = error;
            }
        }

        if (!inviteClient) {
            // Log for debugging
            console.log('Email search failed after all attempts:', {
                searchEmail: email.trim(),
                error: inviteClientError
            });
            
            return json({ error: 'No user found with that email address. Make sure the user has an account and the email is correct.' }, { status: 404 });
        }

        // Check if user is already a member
        const { data: existingMember, error: existingError } = await adminSupabase
            .from('client_collaboration')
            .select('id')
            .eq('collaboration_id', collaborationId)
            .eq('client_id', inviteClient.id)
            .maybeSingle();

        if (existingError) {
            console.error('Error checking existing membership:', existingError);
            return json({ error: 'Error checking membership status' }, { status: 500 });
        }

        if (existingMember) {
            return json({ error: 'User is already a member of this collaboration' }, { status: 400 });
        }

        // Add user to collaboration
        const { data: newMembership, error: insertError } = await adminSupabase
            .from('client_collaboration')
            .insert({
                collaboration_id: collaborationId,
                client_id: inviteClient.id,
                role: role
            })
            .select(`
                *,
                client:client(id, email, first_name, last_name)
            `)
            .single();

        if (insertError) {
            console.error('Error adding member to collaboration:', insertError);
            return json({ error: 'Failed to add member to collaboration' }, { status: 500 });
        }

        return json({ 
            success: true,
            member: {
                id: newMembership.client.id,
                email: newMembership.client.email,
                firstName: newMembership.client.first_name,
                lastName: newMembership.client.last_name,
                role: newMembership.role,
                joinedAt: newMembership.created_at
            },
            message: `${inviteClient.first_name} ${inviteClient.last_name} has been added to the collaboration`
        });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 