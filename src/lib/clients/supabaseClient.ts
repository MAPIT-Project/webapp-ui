import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';

// Validate environment variables
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Warn if still using localhost in production
if (typeof window !== 'undefined' && PUBLIC_SUPABASE_URL.includes('localhost')) {
	console.warn(
		'Warning: Using localhost Supabase URL. Make sure to set production URLs for deployment.'
	);
}

// Using createBrowserClient from @supabase/ssr instead of the deprecated
// createSupabaseBrowserClient from auth-helpers-sveltekit
// This is the recommended approach for SvelteKit projects using Supabase

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
