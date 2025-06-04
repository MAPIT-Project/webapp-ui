import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Create server-side Supabase client with proper cookie handling
        const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                get: (key: string) => cookies.get(key),
                set: (key: string, value: string, options: any) => {
                    console.log(`[LOGIN] Setting cookie: ${key} = ${value ? 'has_value' : 'empty'}`);
                    cookies.set(key, value, { 
                        ...options, 
                        path: '/',
                        httpOnly: false,  // Allow client access
                        secure: false,    // For localhost development
                        sameSite: 'lax'   // Allow cross-site requests
                    });
                },
                remove: (key: string, options: any) => {
                    console.log(`[LOGIN] Removing cookie: ${key}`);
                    cookies.delete(key, { ...options, path: '/' });
                }
            }
        });

        // Perform authentication on server side
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error.message);
            return json({ error: error.message }, { status: 401 });
        }

        if (!data.user || !data.session) {
            return json({ error: 'Authentication failed' }, { status: 401 });
        }

        console.log(`[LOGIN] Successfully authenticated user: ${data.user.email}`);
        console.log(`[LOGIN] Session expires at: ${new Date(data.session.expires_at * 1000).toISOString()}`);

        // Return success response with user data
        return json({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                created_at: data.user.created_at
            },
            session: {
                access_token: data.session.access_token,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        console.error('Server error during login:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};