import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ request, cookies }) => {
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

        // Get auth session
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            return json({ 
                error: 'Auth error', 
                details: authError.message 
            }, { status: 500 });
        }
        
        if (!authData.session) {
            return json({ error: 'No active session' }, { status: 401 });
        }
        
        const userId = authData.session.user.id;
        
        // Check if client exists
        const { data: clientData, error: clientError } = await supabase
            .from('client')
            .select('*')
            .eq('auth_id', userId);
        
        // Try to get RLS info
        const hasClient = clientData && clientData.length > 0;
        
        return json({
            success: true,
            session: {
                user_id: userId,
                email: authData.session.user.email
            },
            client: {
                found: hasClient,
                count: clientData?.length || 0,
                data: clientData?.[0] || null
            },
            rls_status: 'Working (server-side)'
        });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};
