import { writable } from 'svelte/store';
import { supabase } from '$lib/clients/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the session
export const user = writable<User | null>(null);

// Initialize user state
export async function initializeSession() {
	// Get current session data
	const { data } = await supabase.auth.getSession();

	// Set user if session exists
	if (data.session?.user) {
		user.set(data.session.user);
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
