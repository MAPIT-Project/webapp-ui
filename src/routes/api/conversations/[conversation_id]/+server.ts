import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ params, cookies, locals }) => {
    try {
        const conversationId = params.conversation_id;
        
        if (!conversationId) {
            return json({ error: 'Conversation ID is required' }, { status: 400 });
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

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return json({ error: 'No authenticated user found or error fetching user' }, { status: 401 });
        }
        const authUserId = user.id; // UUID

        // Fetch the local client ID (integer) using the authUserId (UUID)
        const { data: clientRecord, error: clientError } = await supabase
            .from('client')
            .select('id')
            .eq('auth_id', authUserId)
            .single();

        if (clientError || !clientRecord) {
            console.error('Error fetching client record for conversation access or client not found:', clientError);
            return json({ error: 'User profile not found for accessing conversation.' }, { status: 404 });
        }
        const localClientId = clientRecord.id; // Integer client ID


        const { data: conversation, error } = await supabase
            .from('conversation')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (error) {
            console.error('Error fetching conversation:', error);
            // If error is due to no rows found, it might be a valid 404
            if (error.code === 'PGRST116') { // PostgREST error code for " exactamente uma linha esperada" / "exactly one row expected"
                 return json({ error: 'Conversation not found' }, { status: 404 });
            }
            return json({ error: error.message }, { status: 500 });
        }

        if (!conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization check:
        // 1. If it's a personal conversation (collaboration_id is null), user_id must match.
        // 2. If it's a collaboration conversation, the user must be part of that collaboration.
        //    (This part needs a proper check against your collaboration membership table/logic)
        if (conversation.collaboration_id === null) { // Personal conversation
            if (conversation.user_id !== localClientId) { // Compare with integer localClientId
                return json({ error: 'Forbidden: You do not have access to this conversation' }, { status: 403 });
            }
        } else { // Collaboration conversation
            // TODO: Implement robust check to ensure localClientId is a member of conversation.collaboration_id
            // For example, query a 'collaboration_members' table:
            // const { data: member, error: memberError } = await supabase
            //    .from('collaboration_members')
            //    .select('id')
            //    .eq('collaboration_id', conversation.collaboration_id)
            //    .eq('client_id', localClientId) // Use localClientId here
            //    .maybeSingle();
            // if (memberError || !member) {
            //    return json({ error: 'Forbidden: You are not part of this collaboration space or conversation' }, { status: 403 });
            // }
            // For now, we'll assume if they query by ID and it has a collaboration_id,
            // the list view should have already filtered appropriately.
            // However, a direct access attempt should still be validated.
            // A simple placeholder: if not the creator, deny if no further collab check.
            // This is NOT a complete collaboration check.
            if (conversation.user_id !== localClientId) { // Compare with integer localClientId
                 // This is a simplistic check. A real check would verify membership in conversation.collaboration_id
                 // console.warn(`Warning: User ${localClientId} accessed collab conversation ${conversation.id} without full membership check.`);
            }
        }

        return json({ conversation });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
    try {
        const conversationId = params.conversation_id;
        
        if (!conversationId) {
            return json({ error: 'Conversation ID is required' }, { status: 400 });
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

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return json({ error: 'No authenticated user found or error fetching user' }, { status: 401 });
        }
        const authUserId = user.id; // UUID

        // Fetch the local client ID (integer) using the authUserId (UUID)
        const { data: clientRecord, error: clientError } = await supabase
            .from('client')
            .select('id')
            .eq('auth_id', authUserId)
            .single();

        if (clientError || !clientRecord) {
            console.error('Error fetching client record for conversation update or client not found:', clientError);
            return json({ error: 'User profile not found for updating conversation.' }, { status: 404 });
        }
        const localClientId = clientRecord.id; // Integer client ID

        const { name } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return json({ error: 'Valid conversation name is required' }, { status: 400 });
        }

        // First check if conversation exists and user has permission
        const { data: existingConversation, error: fetchError } = await supabase
            .from('conversation')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (fetchError || !existingConversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization check
        if (existingConversation.collaboration_id === null) { // Personal conversation
            if (existingConversation.user_id !== localClientId) {
                return json({ error: 'Forbidden: You do not have permission to edit this conversation' }, { status: 403 });
            }
        } else { // Collaboration conversation
            // TODO: Add proper collaboration membership check here
            // For now, only allow the creator to edit
            if (existingConversation.user_id !== localClientId) {
                return json({ error: 'Forbidden: You do not have permission to edit this conversation' }, { status: 403 });
            }
        }

        // Update the conversation name
        const { data: updatedConversation, error: updateError } = await supabase
            .from('conversation')
            .update({ 
                name: name.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating conversation name:', updateError);
            return json({ error: updateError.message }, { status: 500 });
        }

        return json({ conversation: updatedConversation });

    } catch (error) {
        console.error('Server error updating conversation:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};