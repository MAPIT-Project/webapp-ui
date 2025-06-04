import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, cookies }) => {
    try {
        const session = await locals.getSession();
        
        // Get all cookies for debugging
        const allCookies = cookies.getAll();
        
        return json({
            sessionExists: !!session,
            sessionUser: session?.user?.email || null,
            sessionExpiry: session?.expires_at || null,
            cookiesCount: allCookies.length,
            hasAuthCookies: allCookies.some(c => c.name.includes('supabase')),
            cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
        });
        
    } catch (error) {
        return json({
            error: 'Error checking session',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};