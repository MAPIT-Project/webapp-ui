import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import { apiRateLimit, getClientIP } from '$lib/server/rateLimit';
import { json } from '@sveltejs/kit';

// Global rate limiting middleware
const rateLimitHandle: Handle = async ({ event, resolve }) => {
	// Temporarily disable global rate limiting to avoid conflicts with endpoint-specific rate limiting
	// TODO: Re-enable after debugging login issues

	// Apply rate limiting to all API routes (DISABLED)
	// if (event.url.pathname.startsWith('/api/')) {
	//   const ip = getClientIP(event);
	//
	//   try {
	//     await apiRateLimit.check(ip);
	//   } catch (error) {
	//     if (error instanceof Error) {
	//       try {
	//         const errorData = JSON.parse(error.message);
	//         return json(errorData, {
	//           status: 429,
	//           headers: {
	//             'X-RateLimit-Limit': '100',
	//             'X-RateLimit-Remaining': '0',
	//             'Retry-After': errorData.retryAfter.toString()
	//           }
	//         });
	//       } catch {
	//         return json(
	//           { error: 'Too many API requests. Please slow down.' },
	//           { status: 429 }
	//         );
	//       }
	//     }
	//     return json(
	//       { error: 'Too many API requests. Please slow down.' },
	//       { status: 429 }
	//     );
	//   }
	// }

	return resolve(event);
};

// Supabase authentication middleware
const supabaseHandle: Handle = async ({ event, resolve }) => {
	try {
		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				get: (key) => event.cookies.get(key),
				set: (key, value, options) => {
					event.cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key, options) => {
					event.cookies.delete(key, { ...options, path: '/' });
				}
			}
		});

		// Use getUser() instead of getSession() for secure server-side authentication
		// getUser() validates the JWT against the Supabase Auth server
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		event.locals.supabase = supabase;
		// Create a minimal session object with the authenticated user
		// The user from getUser() is verified against the Supabase Auth server
		event.locals.session = user ? { 
			user,
			// Session expiry is handled by Supabase automatically via getUser() which will fail if expired
			expires_at: Math.floor(Date.now() / 1000) + 3600 // Default 1 hour, but getUser() is the real check
		} : null;
		event.locals.user = user ?? null;
	} catch (error) {
		console.error('Error in supabaseHandle:', error);
		// Continue without authentication if there's an error
		event.locals.supabase = null;
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};

// Combine middlewares with rate limiting first
export const handle = sequence(rateLimitHandle, supabaseHandle);
