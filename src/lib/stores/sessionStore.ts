import { writable } from 'svelte/store';
import { supabase } from '$lib/clients/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the session
export const user = writable<User | null>(null);

// Helper to race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
		)
	]);
}

// Initialize user state
// Accepts an optional server-validated user to set immediately,
// so child components don't have to wait for a client-side auth round-trip.
export async function initializeSession(serverUser?: User | null) {
	console.log('[SESSION STORE] initializeSession called. serverUser:', serverUser?.email ?? 'NULL');

	// If the server already validated a session, set the user store immediately.
	// This unblocks child components that depend on $user right away.
	if (serverUser) {
		console.log('[SESSION STORE] Setting user store from server user:', serverUser.email);
		user.set(serverUser);
	}

	// Attempt a client-side auth refresh in the background.
	// DISABLED: Prevents conflicts with server-side authentication
	// This may fail if the browser can't reach Supabase directly (e.g. self-hosted
	// Supabase behind a firewall, CORS issues, etc.), but the app still works
	// because API routes use server-side Supabase with cookies.
	// try {
	// 	console.log('[SESSION STORE] Attempting client-side supabase.auth.getUser() with 5s timeout...');
	// 	const { data: { user: currentUser }, error } = await withTimeout(
	// 		supabase.auth.getUser(),
	// 		5000 // 5 second timeout to prevent infinite hanging
	// 	);

	// 	if (!error && currentUser) {
	// 		console.log('[SESSION STORE] Client-side auth returned user:', currentUser.email);
	// 		user.set(currentUser);
	// 	} else if (error) {
	// 		console.warn('[SESSION STORE] Client-side auth check returned error:', error.message);
	// 		// Don't clear the user if we already have a server-validated user
	// 	}
	// } catch (err) {
	// 	console.warn('[SESSION STORE] Client-side auth check failed (this is OK if using server session):', err);
	// 	// Don't clear the user — we trust the server-validated session
	// }

	console.log('[SESSION STORE] initializeSession finished. Setting up onAuthStateChange listener.');

	// Subscribe to auth state changes
	// DISABLED: Prevents conflicts with server-side authentication
	// supabase.auth.onAuthStateChange((event, session) => {
	// 	console.log('[SESSION STORE] onAuthStateChange event:', event, 'user:', session?.user?.email ?? 'NULL');
	// 	if (event === 'SIGNED_IN' && session?.user) {
	// 		user.set(session.user);
	// 	} else if (event === 'SIGNED_OUT') {
	// 		user.set(null);
	// 	}
	// });
}
