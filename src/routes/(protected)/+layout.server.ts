import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    const session = await locals.getSession();

    console.log(`[(protected)/+layout.server.ts] Session check for ${url.pathname}:`, session ? 'Session found' : 'No session');

    if (!session) {
        // Adjust to your actual login page route
        const redirectTo = `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
        console.log(`[(protected)/+layout.server.ts] No session, redirecting to: ${redirectTo}`);
        throw redirect(303, redirectTo);
    }

    return {
        session, // Pass session to page data, making it available to child pages/layouts
    };
};
