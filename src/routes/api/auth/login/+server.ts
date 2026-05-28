import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { authRateLimit, extractClientIP } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	// Apply rate limiting
	const ip = extractClientIP(request, getClientAddress);

	try {
		await authRateLimit.check(ip);
	} catch (error) {
		if (error instanceof Error) {
			try {
				const errorData = JSON.parse(error.message);
				return json(errorData, {
					status: 429,
					headers: {
						'X-RateLimit-Limit': '5',
						'X-RateLimit-Remaining': '0',
						'Retry-After': errorData.retryAfter.toString()
					}
				});
			} catch {
				return json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
			}
		}
		return json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
	}

	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Create server-side Supabase client with proper cookie handling
		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				getAll() {
					return cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookies.set(name, value, {
							...options,
							path: '/',
							httpOnly: false, // Allow client access
							secure: true, // Required for HTTPS
							sameSite: 'lax' // Allow cross-site requests
						});
					});
				}
			}
		});

		// Perform authentication on server side
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Login error:', error.message);
			return json({ error: error.message }, { status: 401 });
		}

		if (!data.user || !data.session) {
			return json({ error: 'Authentication failed' }, { status: 401 });
		}

		console.log(`[LOGIN] Successfully authenticated user: ${data.user.email}`);
		console.log(
			`[LOGIN] Session expires at: ${new Date((data.session.expires_at || 0) * 1000).toISOString()}`
		);

		// Add rate limit headers to successful response
		const rateLimitInfo = authRateLimit.info(ip);

		// Return success response with user data
		return json(
			{
				success: true,
				user: {
					id: data.user.id,
					email: data.user.email,
					created_at: data.user.created_at
				},
				session: {
					access_token: data.session.access_token,
					expires_at: data.session.expires_at as number
				}
			},
			{
				headers: {
					'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
					'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
					'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime / 1000).toString()
				}
			}
		);
	} catch (error) {
		console.error('Server error during login:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
