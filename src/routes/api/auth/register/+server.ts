import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { authRateLimit, extractClientIP } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
    // Apply rate limiting for registration
    const ip = extractClientIP(request, getClientAddress);
    
    try {
        await authRateLimit.check(ip);
    } catch (error) {
        if (error instanceof Error) {
            try {
                const errorData = JSON.parse(error.message);
                return json(errorData, { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '5',
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': errorData.retryAfter.toString()
                    }
                });
            } catch {
                return json(
                    { error: 'Too many registration attempts. Please try again later.' },
                    { status: 429 }
                );
            }
        }
        return json(
            { error: 'Too many registration attempts. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const { email, password, firstName, lastName } = await request.json();

        if (!email || !password) {
            return json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

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

        // Perform registration on server side
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error('Registration error:', error.message);
            return json({ error: error.message }, { status: 400 });
        }

        if (!data.user) {
            return json({ error: 'Registration failed' }, { status: 400 });
        }

        // Create client record in database
        try {
            const { data: clientData, error: clientError } = await supabase
                .from('client')
                .insert([{
                    auth_id: data.user.id,
                    email: email,
                    first_name: firstName || email.split('@')[0],
                    last_name: lastName || 'User',
                    password: 'password_not_used'
                }])
                .select()
                .single();

            if (clientError) {
                console.error('Error creating client record:', clientError);
                // Registration was successful but client creation failed
                // Return success anyway since the user was created
            }

            return json({
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    created_at: data.user.created_at
                },
                client: clientData,
                message: 'Registration successful'
            });

        } catch (clientError) {
            console.error('Unexpected error creating client:', clientError);
            return json({
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    created_at: data.user.created_at
                },
                message: 'Registration successful, but client record creation failed'
            });
        }

    } catch (error) {
        console.error('Server error during registration:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};