import { supabase } from './supabaseClient';
import type { Client } from '$lib/server/db/schema';

/**
 * Get the client data for the currently authenticated user
 */
export async function getCurrentClient() {
    return await ensureClientExists();
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
export async function createClientWithUserId(userId: string, email: string, firstName: string, lastName: string) {
    console.log('Creating client with specific auth_id:', { userId, email, firstName, lastName });
    
    // First check if client already exists with this auth_id
    const { data: existingClient } = await supabase
        .from('client')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle();
        
    if (existingClient) {
        console.log('Client already exists with this auth_id:', existingClient);
        return existingClient as Client;
    }
    
    // Then check if client exists with this email
    const { data: existingByEmail } = await supabase
        .from('client')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
    if (existingByEmail) {
        console.log('Client exists with this email, updating auth_id:', existingByEmail);
        
        // Update auth_id and names for this client
        const { data: updated, error: updateError } = await supabase
            .from('client')
            .update({ 
                auth_id: userId,
                first_name: firstName,
                last_name: lastName
            })
            .eq('id', existingByEmail.id)
            .select()
            .single();
            
        if (updateError) {
            console.error('Error updating existing client auth_id:', updateError);
            return existingByEmail as Client;
        }
        
        return updated as Client;
    }
    
    // No existing client, create new one
    const { data, error } = await supabase
        .from('client')
        .insert([{
            auth_id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            password: 'password_not_used' // Using Supabase auth
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating client record during registration:', error);
        
        // One last attempt - try with a timestamp suffix on the name to avoid conflicts
        const timestamp = new Date().getTime();
        const { data: fallbackClient, error: fallbackError } = await supabase
            .from('client')
            .insert([{
                auth_id: userId,
                email: email,
                first_name: firstName,
                last_name: lastName,
                password: 'password_not_used'
            }])
            .select()
            .single();
            
        if (fallbackError) {
            console.error('Fallback client creation also failed:', fallbackError);
            return null;
        }
        
        return fallbackClient as Client;
    }
    
    console.log('Successfully created client with specific auth_id:', data);
    return data as Client;
}

/**
 * Check if client exists for the authenticated user, if not create one
 */
export async function ensureClientExists(firstName?: string, lastName?: string) {
    try {
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
        
        console.log('Checking for client with auth_id:', userId);
        
        // First check if client exists by auth_id
        const { data: existingClientByAuth, error: authFetchError } = await supabase
            .from('client')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle();
        
        // If client exists by auth_id, return it
        if (existingClientByAuth) {
            console.log('Found existing client by auth_id:', existingClientByAuth);
            return existingClientByAuth as Client;
        }
        
        // If not found by auth_id, try to find by email
        console.log('No client found by auth_id, trying email:', userEmail);
        const { data: existingClientByEmail, error: emailFetchError } = await supabase
            .from('client')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
        
        // If client exists by email but has different auth_id, update it
        if (existingClientByEmail) {
            console.log('Found existing client by email:', existingClientByEmail);
            
            // Update the auth_id to match the current user
            const updateData: any = { auth_id: userId };
            
            // Only update names if provided
            if (firstName) updateData.first_name = firstName;
            if (lastName) updateData.last_name = lastName;
            
            const { data: updatedClient, error: updateError } = await supabase
                .from('client')
                .update(updateData)
                .eq('id', existingClientByEmail.id)
                .select()
                .single();
            
            if (updateError) {
                console.error('Error updating client auth_id:', updateError);
                // Return the existing client anyway
                return existingClientByEmail as Client;
            }
            
            console.log('Successfully updated client auth_id:', updatedClient);
            return updatedClient as Client;
        }
        
        // If no client found by either method, create a new one
        const defaultFirstName = firstName || userEmail.split('@')[0] || 'New';
        const defaultLastName = lastName || 'User';
        
        console.log('Creating new client for auth user:', { userId, userEmail, defaultFirstName, defaultLastName });
        
        // Try a raw SQL query to find any client with matching email regardless of case
        const { data: existingClients, error: rawQueryError } = await supabase
            .from('client')
            .select('*');
        
        if (existingClients && existingClients.length > 0) {
            // Manually check for case-insensitive email match
            const emailLower = userEmail.toLowerCase();
            const matchingClient = existingClients.find(
                client => client.email.toLowerCase() === emailLower
            );
            
            if (matchingClient) {
                console.log('Found existing client via case-insensitive check:', matchingClient);
                
                // Update the auth_id and names if provided
                const updateData: any = { auth_id: userId };
                if (firstName) updateData.first_name = firstName;
                if (lastName) updateData.last_name = lastName;
                
                const { data: updatedClient, error: updateError } = await supabase
                    .from('client')
                    .update(updateData)
                    .eq('id', matchingClient.id)
                    .select()
                    .single();
                
                if (!updateError && updatedClient) {
                    console.log('Successfully updated client auth_id:', updatedClient);
                    return updatedClient as Client;
                }
                
                // Return the existing client even if update failed
                return matchingClient as Client;
            }
        }
        
        // Last resort - if we really couldn't find a matching client, try to create one
        try {
            const { data: newClient, error: insertError } = await supabase
                .from('client')
                .insert([{
                    auth_id: userId,
                    email: userEmail,
                    first_name: defaultFirstName,
                    last_name: defaultLastName,
                    password: 'password_not_used' // Using Supabase auth
                }])
                .select()
                .single();
            
            if (insertError) {
                console.error('Error creating client record:', insertError);
                
                // Special handling for duplicate email
                if (insertError.code === '23505' && insertError.message.includes('client_email_unique')) {
                    // Retry with a direct SQL approach to find the conflicting client
                    return await retryClientLookupAfterConflict(userId, userEmail, defaultFirstName, defaultLastName);
                }
                
                return null;
            }
            
            console.log('Successfully created client:', newClient);
            return newClient as Client;
        } catch (insertErr) {
            console.error('Unexpected error creating client:', insertErr);
            return null;
        }
    } catch (error) {
        console.error('Unexpected error in ensureClientExists:', error);
        return null;
    }
}

/**
 * Retry client lookup after a conflict error
 */
async function retryClientLookupAfterConflict(userId: string, userEmail: string, firstName?: string, lastName?: string) {
    console.log('Retrying client lookup after conflict...');
    
    // First, try one more time to get by email (maybe someone else created it just now)
    const { data: retryClient, error: retryError } = await supabase
        .from('client')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
    
    if (retryClient) {
        console.log('Found client on retry:', retryClient);
        
        // Update the auth_id and names if provided
        const updateData: any = { auth_id: userId };
        if (firstName) updateData.first_name = firstName;
        if (lastName) updateData.last_name = lastName;
        
        const { data: updatedClient, error: updateError } = await supabase
            .from('client')
            .update(updateData)
            .eq('id', retryClient.id)
            .select()
            .single();
        
        if (!updateError && updatedClient) {
            return updatedClient as Client;
        }
        
        return retryClient as Client;
    }
    
    // If we STILL can't find it, use the setup-client API as a last resort
    try {
        const response = await fetch('/api/setup-client');
        const result = await response.json();
        
        if (result.success && result.client) {
            console.log('Client fixed via setup-client API:', result.client);
            return result.client as Client;
        }
    } catch (e) {
        console.error('Error using setup-client API:', e);
    }
    
    return null;
}

/**
 * Get client details by auth ID
 */
export async function getClientByAuthId(authId: string) {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .eq('auth_id', authId)
      .single();
      
    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching client:', error);
    return null;
  }
}
