import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ url, cookies }) => {
    try {
        const conversationId = url.searchParams.get('conversationId');
        
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

        const { data: authData } = await supabase.auth.getSession();
        
        if (!authData.session?.user) {
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('message')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return json({ error: error.message }, { status: 500 });
        }

        return json({ messages: data });

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
        const { conversationId, text, sender } = await request.json();

        if (!conversationId || !text || !sender) {
            return json({ error: 'conversationId, text, and sender are required' }, { status: 400 });
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

        const { data: authData } = await supabase.auth.getSession();
        
        if (!authData.session?.user) {
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('message')
            .insert([{ 
                conversation_id: conversationId, 
                text, 
                sender 
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding message:', error);
            return json({ error: error.message }, { status: 500 });
        }

        return json({ message: data });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};