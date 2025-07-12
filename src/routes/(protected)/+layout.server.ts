import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    try {
        console.log(`[(protected)/+layout.server.ts] Checking access to ${url.pathname}`);
        
        const session = locals.session;

        console.log(`[(protected)/+layout.server.ts] Session check for ${url.pathname}:`, 
            session ? `Session found for user ${session.user?.email}, expires: ${new Date((session.expires_at || 0) * 1000).toISOString()}` : 'No session found');

        if (!session) {
            const redirectTo = `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
            console.log(`[(protected)/+layout.server.ts] No session, redirecting to: ${redirectTo}`);
            throw redirect(303, redirectTo);
        }

        // Check if session is expired
        const now = Date.now();
        const expiryTime = (session.expires_at || 0) * 1000;
        
        console.log(`[(protected)/+layout.server.ts] Session expiry check - Now: ${now}, Expires: ${expiryTime}, Valid: ${now < expiryTime}`);

        if (session.expires_at && now > expiryTime) {
            console.log(`[(protected)/+layout.server.ts] Session expired, redirecting to login`);
            throw redirect(303, '/login');
        }

        console.log(`[(protected)/+layout.server.ts] Session valid, allowing access to ${url.pathname}`);

        return {
            session, // Pass session to page data, making it available to child pages/layouts
        };
    } catch (error) {
        if (error instanceof Response) {
            // This is a redirect, re-throw it
            console.log(`[(protected)/+layout.server.ts] Redirecting due to auth check`);
            throw error;
        }
        
        console.error('[(protected)/+layout.server.ts] Error checking session:', error);
        throw redirect(303, '/login');
    }
};
