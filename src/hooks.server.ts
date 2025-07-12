import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import { apiRateLimit, getClientIP } from '$lib/server/rateLimit';
import { json } from '@sveltejs/kit';

// Global rate limiting middleware
const rateLimitHandle: Handle = async ({ event, resolve }) => {
  // Apply rate limiting to all API routes
  if (event.url.pathname.startsWith('/api/')) {
    const ip = getClientIP(event);
    
    try {
      await apiRateLimit.check(ip);
    } catch (error) {
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          return json(errorData, { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'Retry-After': errorData.retryAfter.toString()
            }
          });
        } catch {
          return json(
            { error: 'Too many API requests. Please slow down.' },
            { status: 429 }
          );
        }
      }
      return json(
        { error: 'Too many API requests. Please slow down.' },
        { status: 429 }
      );
    }
  }

  return resolve(event);
};

// Supabase authentication middleware
const supabaseHandle: Handle = async ({ event, resolve }) => {
  const supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key, options) => {
          event.cookies.delete(key, { ...options, path: '/' });
        }
      }
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  event.locals.supabase = supabase;
  event.locals.session = session;
  event.locals.user = session?.user ?? null;

  return resolve(event);
};

// Combine middlewares with rate limiting first
export const handle = sequence(rateLimitHandle, supabaseHandle);
