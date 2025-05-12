import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Changed from @supabase/auth-helpers-sveltekit
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Log all incoming requests and their cookies
  console.log(`[HOOKS] Request path: ${event.url.pathname}`);
  const cookies = event.request.headers.get('cookie');
  console.log(`[HOOKS] Cookies for ${event.url.pathname}:`, cookies || 'No cookies sent');

  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key: string) => event.cookies.get(key),
      set: (key: string, value: string, options: CookieOptions) => {
        event.cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key: string, options: CookieOptions) => {
        event.cookies.delete(key, { ...options, path: '/' });
      },
    },
  });

  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    // Log session status when getSession is called
    if (event.url.pathname.startsWith('/api/')) { // Log specifically for API routes
        console.log(`[HOOKS] getSession() called for API route ${event.url.pathname}. Session present: ${!!session}`);
    }
    return session;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      // Add 'x-supabase-api-version' if required by @supabase/ssr, content-range is usually for Supabase storage or PostgREST
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
