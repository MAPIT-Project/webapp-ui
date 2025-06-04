import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const POST: RequestHandler = async ({ cookies }) => {
    try {
        // Create server-side Supabase client
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

        // Sign out on server side
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error.message);
            return json({ error: error.message }, { status: 400 });
        }

        return json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Server error during logout:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};