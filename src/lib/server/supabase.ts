import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';

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
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
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
