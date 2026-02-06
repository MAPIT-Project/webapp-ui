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
	// If the server already validated a session, set the user store immediately.
	// This unblocks child components that depend on $user right away.
	if (serverUser) {
		user.set(serverUser);
	}

	// Attempt a client-side auth refresh in the background.
	// This may fail if the browser can't reach Supabase directly (e.g. self-hosted
	// Supabase behind a firewall, CORS issues, etc.), but the app still works
	// because API routes use server-side Supabase with cookies.
	try {
		const { data: { user: currentUser }, error } = await withTimeout(
			supabase.auth.getUser(),
			5000 // 5 second timeout to prevent infinite hanging
		);

		if (!error && currentUser) {
			user.set(currentUser);
		} else if (error) {
			console.warn('Client-side auth check returned error:', error.message);
			// Don't clear the user if we already have a server-validated user
		}
	} catch (err) {
		console.warn('Client-side auth check failed (this is OK if using server session):', err);
		// Don't clear the user — we trust the server-validated session
	}

	// Subscribe to auth state changes
	supabase.auth.onAuthStateChange((event, session) => {
		if (event === 'SIGNED_IN' && session?.user) {
			user.set(session.user);
		} else if (event === 'SIGNED_OUT') {
			user.set(null);
		}
	});
}
