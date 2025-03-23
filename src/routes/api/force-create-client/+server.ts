import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/clients/supabaseClient';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { auth_id, email } = body;
        
        if (!auth_id || !email) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }
        
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
                name: `${name}_${now}`, // Add timestamp to avoid conflicts
                password: 'password_not_used'
            }])
            .select()
            .single();
            
        if (insertError) {
            return json({ 
                error: 'Failed to create client even with fallback',
                details: insertError.message
            }, { status: 500 });
        }
        
        return json({
            success: true,
            message: 'Created client with fallback method',
            client: newClient
        });
        
    } catch (error) {
        console.error('Error in force-create-client:', error);
        return json({ 
            error: 'An error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
};
