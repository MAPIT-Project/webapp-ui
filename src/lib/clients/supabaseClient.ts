import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';

// Using createBrowserClient from @supabase/ssr instead of the deprecated
// createSupabaseBrowserClient from auth-helpers-sveltekit
// This is the recommended approach for SvelteKit projects using Supabase

export const supabase = createBrowserClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
);

