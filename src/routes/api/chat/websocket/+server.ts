import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
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

        return json({ message: newMessage });

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

        // Build query
        let query = supabase
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

        return json({ messages: data || [] });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 