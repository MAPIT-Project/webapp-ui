import { supabase } from './supabaseClient';
import type { Client } from '$lib/server/db/schema';

/**
 * Get the client data for the currently authenticated user
 */
export async function getCurrentClient() {
    const { data: authData } = await supabase.auth.getSession();
    
    if (!authData.session?.user) {
        console.error('No authenticated user found');
        return null;
    }
    
    const userId = authData.session.user.id;
    
    const { data, error } = await supabase
        .from('client')
        .select('*')
        .eq('auth_id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching client data:', error);
        return null;
    }
    
    return data as Client;
}

/**
 * Create a new client record for the authenticated user
 */
export async function createClient(name: string) {
    const { data: authData } = await supabase.auth.getSession();
    
    if (!authData.session?.user) {
        console.error('No authenticated user found');
        return null;
    }
    
    const userId = authData.session.user.id;
    const userEmail = authData.session.user.email;
    
    if (!userEmail) {
        console.error('User email not found');
        return null;
    }
    
    const { data, error } = await supabase
        .from('client')
        .insert([{
            auth_id: userId,
            email: userEmail,
            name: name,
            password: 'password_not_used' // We use Supabase auth, so this isn't needed
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating client record:', error);
        return null;
    }
    
    return data as Client;
}

/**
 * Create a new client record with specific userId (used during registration)
 */
export async function createClientWithUserId(userId: string, email: string, name: string) {
    const { data, error } = await supabase
        .from('client')
        .insert([{
            auth_id: userId,
            email: email,
            name: name,
            password: 'password_not_used' // Using Supabase auth
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating client record during registration:', error);
        return null;
    }
    
    return data as Client;
}

/**
 * Check if client exists for the authenticated user, if not create one
 */
export async function ensureClientExists(name?: string) {
    const client = await getCurrentClient();
    
    if (client) {
        return client;
    }
    
    // No client found, create one
    const defaultName = name || 'New User';
    return await createClient(defaultName);
}
