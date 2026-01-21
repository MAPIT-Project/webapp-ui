import { writable } from 'svelte/store';
import { supabase } from '$lib/clients/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the session
export const user = writable<User | null>(null);

// Initialize user state
export async function initializeSession() {
	// Use getUser() for secure authentication check
	const { data: { user: currentUser }, error } = await supabase.auth.getUser();

	// Set user if authenticated
	if (!error && currentUser) {
		user.set(currentUser);
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
