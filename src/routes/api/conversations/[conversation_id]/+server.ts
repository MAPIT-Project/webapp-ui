import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ params, cookies }) => {
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

        const { data: authData } = await supabase.auth.getSession();
        
        if (!authData.session?.user) {
            return json({ error: 'No authenticated user found' }, { status: 401 });
        }

        const { data: conversation, error } = await supabase
            .from('conversation')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (error) {
            console.error('Error fetching conversation:', error);
            return json({ error: error.message }, { status: 500 });
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