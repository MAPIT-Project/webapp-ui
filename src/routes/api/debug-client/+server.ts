import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/clients/supabaseClient';

export const GET: RequestHandler = async ({ request }) => {
    try {
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
            session: {
                user: {
                    id: authData.session.user.id,
                    email: authData.session.user.email,
                }
            },
            client: {
                exists: hasClient,
                data: hasClient ? clientData[0] : null,
                error: clientError ? clientError.message : null
            }
        });
    } catch (error) {
        return json({ 
            error: 'An error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
};
