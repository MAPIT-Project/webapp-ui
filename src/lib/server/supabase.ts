import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';

// Use localhost for server-side requests to avoid proxy issues
const SERVER_SUPABASE_URL = env.PRIVATE_SUPABASE_URL || 'http://localhost:54321';

/**
 * Create a Supabase server client with the correct cookie handling pattern.
 *
 * IMPORTANT: Uses the getAll/setAll pattern required by @supabase/ssr 0.5+.
 * The old get/set/remove pattern corrupts chunked auth tokens during refresh.
 *
 * Prefer using `locals.supabase` from hooks.server.ts when available (it's
 * already configured correctly). Use this helper only when you need a fresh
 * client (e.g. in auth endpoints that set custom cookie options).
 */
export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient(SERVER_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});
}
