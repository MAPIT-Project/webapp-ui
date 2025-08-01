import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { aiQueryRateLimit, extractClientIP } from '$lib/server/rateLimit';

// This endpoint handles adding AI messages to collaboration chats
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	// Apply rate limiting for AI operations
	const ip = extractClientIP(request, getClientAddress);

	try {
		await aiQueryRateLimit.check(ip);
	} catch (error) {
		if (error instanceof Error) {
			try {
				const errorData = JSON.parse(error.message);
				return json(errorData, {
					status: 429,
					headers: {
						'X-RateLimit-Limit': '10',
						'X-RateLimit-Remaining': '0',
						'Retry-After': errorData.retryAfter.toString()
					}
				});
			} catch {
				return json(
					{ error: 'Too many AI requests. Please wait before making another request.' },
					{ status: 429 }
				);
			}
		}
		return json(
			{ error: 'Too many AI requests. Please wait before making another request.' },
			{ status: 429 }
		);
	}

	try {
		const { conversationId, text } = await request.json();

		if (!conversationId || !text || typeof text !== 'string' || text.trim().length === 0) {
			return json({ error: 'conversationId and text are required' }, { status: 400 });
		}

		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				get: (key: string) => cookies.get(key),
				set: (key: string, value: string, options: any) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key: string, options: any) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		});

		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Get client record to verify authentication
		const { data: clientRecord, error: clientError } = await supabase
			.from('client')
			.select('id')
			.eq('auth_id', user.id)
			.single();

		if (clientError || !clientRecord) {
			return json({ error: 'User profile not found' }, { status: 404 });
		}

		// Verify user has access to this conversation
		const { data: conversation, error: convError } = await supabase
			.from('conversation')
			.select('id, collaboration_id')
			.eq('id', conversationId)
			.single();

		if (convError || !conversation) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		// Check that this is a collaboration conversation
		if (!conversation.collaboration_id) {
			return json(
				{ error: 'AI messages are only supported in collaboration conversations' },
				{ status: 403 }
			);
		}

		// Check if user is a member of this collaboration
		const { data: membership, error: membershipError } = await supabase
			.from('client_collaboration')
			.select('id')
			.eq('collaboration_id', conversation.collaboration_id)
			.eq('client_id', clientRecord.id)
			.single();

		if (membershipError || !membership) {
			return json({ error: 'User is not a member of this collaboration' }, { status: 403 });
		}

		// Create or get the AI system user
		let aiUserId: number;

		// Try to find existing AI user
		const { data: existingAiUser, error: findAiError } = await supabase
			.from('client')
			.select('id')
			.eq('email', 'ai@mapit.com')
			.single();

		if (existingAiUser) {
			aiUserId = existingAiUser.id;
		} else {
			// Create AI user if it doesn't exist
			// Generate a special UUID for the AI system user
			const aiAuthId = '00000000-0000-0000-0000-000000000001'; // Special UUID for AI

			const { data: newAiUser, error: createAiError } = await supabase
				.from('client')
				.insert({
					email: 'ai@mapit.com',
					first_name: 'MAPIT',
					last_name: 'AI',
					password: 'system_user', // This user will never log in
					auth_id: aiAuthId // Special UUID for AI system user
				})
				.select('id')
				.single();

			if (createAiError || !newAiUser) {
				console.error('Error creating AI user:', createAiError);
				return json({ error: 'Failed to create AI user' }, { status: 500 });
			}

			aiUserId = newAiUser.id;
		}

		// Save AI message to database
		const { data: newMessage, error: messageError } = await supabase
			.from('message')
			.insert({
				conversation_id: conversationId,
				user_id: aiUserId,
				text: text.trim(),
				sender: 'assistant' // Mark as assistant message
			})
			.select(
				`
                *,
                user:client(id, first_name, last_name, email)
            `
			)
			.single();

		if (messageError) {
			console.error('Error saving AI message:', messageError);
			return json({ error: 'Failed to save AI message' }, { status: 500 });
		}

		// Transform the response to use camelCase for consistency
		const transformedMessage = {
			...newMessage,
			conversationId: newMessage.conversation_id,
			userId: newMessage.user_id,
			createdAt: newMessage.created_at,
			updatedAt: newMessage.updated_at,
			user: newMessage.user
				? {
						id: newMessage.user.id,
						firstName: newMessage.user.first_name,
						lastName: newMessage.user.last_name,
						email: newMessage.user.email
					}
				: null
		};

		// Add rate limit headers to successful response
		const rateLimitInfo = aiQueryRateLimit.info(ip);

		return json(
			{ message: transformedMessage },
			{
				headers: {
					'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
					'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
					'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime / 1000).toString()
				}
			}
		);
	} catch (error) {
		console.error('Server error:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
