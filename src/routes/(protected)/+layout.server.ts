import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    try {
        const session = await locals.getSession();

        console.log(`[(protected)/+layout.server.ts] Session check for ${url.pathname}:`, 
            session ? `Session found for user ${session.user?.email}` : 'No session found');

        if (!session) {
            // Adjust to your actual login page route
            const redirectTo = `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
            console.log(`[(protected)/+layout.server.ts] No session, redirecting to: ${redirectTo}`);
            throw redirect(303, redirectTo);
        }

        // Also verify the session is still valid
        if (session.expires_at && Date.now() > new Date(session.expires_at).getTime()) {
            console.log(`[(protected)/+layout.server.ts] Session expired, redirecting to login`);
            throw redirect(303, '/login');
        }

        return {
            session, // Pass session to page data, making it available to child pages/layouts
        };
    } catch (error) {
        if (error instanceof Response) {
            // This is a redirect, re-throw it
            throw error;
        }
        
        console.error('[(protected)/+layout.server.ts] Error checking session:', error);
        throw redirect(303, '/login');
    }
};
