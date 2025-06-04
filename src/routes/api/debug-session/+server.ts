import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, cookies }) => {
    try {
        const session = await locals.getSession();
        
        // Get all cookies for debugging
        const allCookies = cookies.getAll();
        
        // Check for various Supabase cookie patterns
        const authCookiePatterns = ['supabase', 'sb-', 'auth-token'];
        const hasAuthCookies = allCookies.some(c => 
            authCookiePatterns.some(pattern => c.name.includes(pattern))
        );
        
        return json({
            sessionExists: !!session,
            sessionUser: session?.user?.email || null,
            sessionExpiry: session?.expires_at || null,
            sessionValid: session?.expires_at ? Date.now() < (session.expires_at * 1000) : false,
            cookiesCount: allCookies.length,
            hasAuthCookies,
            cookies: allCookies.map(c => ({ 
                name: c.name, 
                hasValue: !!c.value,
                length: c.value?.length || 0 
            })),
            currentTime: Date.now(),
            sessionExpiryDate: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
        
    } catch (error) {
        return json({
            error: 'Error checking session',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};