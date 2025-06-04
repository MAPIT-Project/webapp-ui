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

        const { data, error } = await supabase
            .from('conversation')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return json({ error: error.message }, { status: 500 });
        }

        return json({ conversations: data });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { topic, name, firstMessage, spaceId } = await request.json();

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

        // Get current client
        const userId = authData.session.user.id;
        const { data: client } = await supabase
            .from('client')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle();

        if (!client) {
            return json({ error: 'Client not found' }, { status: 404 });
        }

        // Create conversation with correct column name
        const conversationData: any = {
            user_id: client.id,  // Changed from client_id to user_id to match schema
            name: name || `Conversation ${new Date().toLocaleDateString()}`,
            topic: topic || firstMessage || 'New conversation'
        };

        // Handle spaceId (collaboration_id)
        if (spaceId && spaceId !== 'personal') {
            conversationData.collaboration_id = parseInt(spaceId);
        }

        const { data: conversation, error: conversationError } = await supabase
            .from('conversation')
            .insert([conversationData])
            .select()
            .single();

        if (conversationError) {
            console.error('Error creating conversation:', conversationError);
            return json({ error: conversationError.message }, { status: 500 });
        }

        // Add first message if provided
        if (firstMessage) {
            const { error: messageError } = await supabase
                .from('message')
                .insert([{
                    conversation_id: conversation.id,
                    text: firstMessage,
                    sender: 'user'
                }]);

            if (messageError) {
                console.error('Error adding first message:', messageError);
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