import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { auth_id, email } = body;
        
        if (!auth_id || !email) {
            return json({ error: 'Missing required fields' }, { status: 400 });
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

        // Get auth session to verify user
        const { data: authData } = await supabase.auth.getSession();
        
        if (!authData.session?.user || authData.session.user.id !== auth_id) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Try to find any existing client with this email (case insensitive)
        const { data: existingClients } = await supabase
            .from('client')
            .select('*');
            
        const matchByEmail = existingClients?.find(
            c => c.email.toLowerCase() === email.toLowerCase()
        );
        
        if (matchByEmail) {
            // Update the auth_id
            const { data: updated } = await supabase
                .from('client')
                .update({ auth_id })
                .eq('id', matchByEmail.id)
                .select()
                .single();
                
            return json({ 
                success: true, 
                message: 'Client updated with new auth_id',
                client: updated
            });
        }
        
        // As a last resort, try to create a new client with a username suffix if needed
        const name = email.split('@')[0];
        const now = new Date().getTime();
        
        // Try to create with a timestamp suffix to avoid conflicts
        const { data: newClient, error: insertError } = await supabase
            .from('client')
            .insert([{
                auth_id,
                email,
                first_name: `${name}_${now}`, // Add timestamp to avoid conflicts
                last_name: 'User',
                password: 'password_not_used'
            }])
            .select()
            .single();
            
        if (insertError) {
            return json({ 
                error: 'Failed to create client',
                details: insertError.message
            }, { status: 500 });
        }
        
        return json({ 
            success: true,
            message: 'New client created',
            client: newClient
        });

    } catch (error) {
        console.error('Server error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};
