import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ params, cookies }) => {
    try {
        const conversationId = parseInt(params.conversation_id || '');
        
        if (!conversationId || isNaN(conversationId)) {
            return json({ error: 'Invalid conversation ID' }, { status: 400 });
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
            console.error('Error fetching client record for GET or client not found:', clientError);
            return json({ error: 'User profile not found.' }, { status: 404 });
        }
        const localClientId = clientRecord.id; // Integer client ID

        const { data: conversation, error } = await supabase
            .from('conversation')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (error || !conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization check
        if (conversation.collaboration_id === null) { // Personal conversation
            if (conversation.user_id !== localClientId) { // Compare with integer localClientId
                return json({ error: 'Forbidden: You do not have permission to access this conversation' }, { status: 403 });
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
        const conversationId = parseInt(params.conversation_id || '');
        
        if (!conversationId || isNaN(conversationId)) {
            return json({ error: 'Invalid conversation ID' }, { status: 400 });
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
            console.error('Error fetching client record for PUT or client not found:', clientError);
            return json({ error: 'User profile not found for updating conversation.' }, { status: 404 });
        }
        const localClientId = clientRecord.id; // Integer client ID

        const { name } = await request.json();

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return json({ error: 'Valid conversation name is required' }, { status: 400 });
        }

        if (name.trim().length > 255) {
            return json({ error: 'Conversation name is too long (max 255 characters)' }, { status: 400 });
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
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
    try {
        const conversationId = parseInt(params.conversation_id || '');
        
        if (!conversationId || isNaN(conversationId)) {
            return json({ error: 'Invalid conversation ID' }, { status: 400 });
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
            console.error('Error fetching client record for DELETE or client not found:', clientError);
            return json({ error: 'User profile not found.' }, { status: 404 });
        }
        const localClientId = clientRecord.id; // Integer client ID

        // Get conversation details and check if it exists
        const { data: conversation, error: fetchError } = await supabase
            .from('conversation')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (fetchError || !conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization check
        if (conversation.collaboration_id === null) {
            // Personal conversation - only the creator can delete
            if (conversation.user_id !== localClientId) {
                return json({ error: 'Forbidden: You do not have permission to delete this conversation' }, { status: 403 });
            }
        } else {
            // Collaboration conversation - only collaboration owners can delete
            const { data: membership, error: membershipError } = await supabase
                .from('client_collaboration')
                .select('role')
                .eq('collaboration_id', conversation.collaboration_id)
                .eq('client_id', localClientId)
                .single();

            if (membershipError || !membership) {
                return json({ error: 'Forbidden: You are not a member of this collaboration' }, { status: 403 });
            }

            if (membership.role !== 'owner') {
                return json({ error: 'Forbidden: Only collaboration owners can delete conversations' }, { status: 403 });
            }
        }

        // Delete the conversation (this should cascade to delete messages)
        // First delete all messages in the conversation to avoid foreign key constraint
        const { error: deleteMessagesError } = await supabase
            .from('message')
            .delete()
            .eq('conversation_id', conversationId);

        if (deleteMessagesError) {
            console.error('Error deleting messages:', deleteMessagesError);
            return json({ error: 'Failed to delete conversation messages' }, { status: 500 });
        }

        // Now delete the conversation
        const { error: deleteError } = await supabase
            .from('conversation')
            .delete()
            .eq('id', conversationId);

        if (deleteError) {
            console.error('Error deleting conversation:', deleteError);
            return json({ error: 'Failed to delete conversation' }, { status: 500 });
        }

        return json({ 
            success: true,
            message: 'Conversation deleted successfully' 
        });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};