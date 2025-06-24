import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createServerClient } from '@supabase/ssr';

// For now, we'll implement a polling-based approach instead of websockets
// This endpoint handles adding collaboration messages
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { conversationId, text } = await request.json();

        if (!conversationId || !text || typeof text !== 'string' || text.trim().length === 0) {
            return json({ error: 'conversationId and text are required' }, { status: 400 });
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
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        // Get client record
        const { data: clientRecord, error: clientError } = await supabase
            .from('client')
            .select('id, first_name, last_name, email')
            .eq('auth_id', user.id)
            .single();

        if (clientError || !clientRecord) {
            return json({ error: 'User profile not found' }, { status: 404 });
        }

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversation')
            .select('id, collaboration_id, user_id')
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Check authorization (collaboration conversation only)
        if (!conversation.collaboration_id) {
            return json({ error: 'Personal conversations do not support collaboration messages' }, { status: 403 });
        }

        // TODO: Add proper collaboration membership check here

        // Save message to database with user information
        const { data: newMessage, error: messageError } = await supabase
            .from('message')
            .insert({
                conversation_id: conversationId,
                user_id: clientRecord.id,
                text: text.trim(),
                sender: 'user'
            })
            .select(`
                *,
                user:client(id, first_name, last_name, email)
            `)
            .single();

        if (messageError) {
            console.error('Error saving message:', messageError);
            return json({ error: 'Failed to save message' }, { status: 500 });
        }

        // Transform the response to use camelCase for consistency
        const transformedMessage = {
            ...newMessage,
            conversationId: newMessage.conversation_id,
            userId: newMessage.user_id,
            createdAt: newMessage.created_at,
            updatedAt: newMessage.updated_at,
            user: newMessage.user ? {
                id: newMessage.user.id,
                firstName: newMessage.user.first_name,
                lastName: newMessage.user.last_name,
                email: newMessage.user.email
            } : null
        };

        return json({ message: transformedMessage });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};

// Get messages for a collaboration conversation with user info
export const GET: RequestHandler = async ({ url, cookies }) => {
    try {
        const conversationId = url.searchParams.get('conversationId');
        const since = url.searchParams.get('since'); // timestamp for polling
        
        if (!conversationId) {
            return json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        // Use regular client for authentication
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
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        // Use service role client for fetching messages with user data (bypasses RLS)
        const serviceSupabase = createServerClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

        // Verify user has access to this conversation using regular client
        const { data: conversation, error: convError } = await supabase
            .from('conversation')
            .select('id, collaboration_id, user_id')
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return json({ error: 'Conversation not found or access denied' }, { status: 404 });
        }

        // Check if it's a collaboration conversation
        if (!conversation.collaboration_id) {
            return json({ error: 'This endpoint is for collaboration conversations only' }, { status: 403 });
        }

        // Build query using service role (can see all user data)
        let query = serviceSupabase
            .from('message')
            .select(`
                *,
                user:client(id, first_name, last_name, email)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        // If polling, only get messages since timestamp
        if (since) {
            query = query.gt('created_at', since);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching messages:', error);
            return json({ error: error.message }, { status: 500 });
        }

        // Transform all messages to use camelCase for consistency
        const transformedMessages = (data || []).map(message => {
            return {
                ...message,
                conversationId: message.conversation_id,
                userId: message.user_id,
                createdAt: message.created_at,
                updatedAt: message.updated_at,
                user: message.user ? {
                    id: message.user.id,
                    firstName: message.user.first_name,
                    lastName: message.user.last_name,
                    email: message.user.email
                } : null
            };
        });

        return json({ messages: transformedMessages });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 