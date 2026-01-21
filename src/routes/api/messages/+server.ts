import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const conversationId = url.searchParams.get('conversationId');

		if (!conversationId) {
			return json({ error: 'Conversation ID is required' }, { status: 400 });
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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Fetch all messages with citations included in a single query
		const { data, error } = await supabase
			.from('message')
			.select('*, citations')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error fetching messages:', error);
			return json({ error: error.message }, { status: 500 });
		}

		// Process the data to ensure citations are properly parsed
		const messagesWithCitations = data.map(message => ({
			...message,
			citations: message.citations || [] // Ensure citations is always an array
		}));

		return json({ messages: messagesWithCitations });
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

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const {
			conversationId,
			text,
			sender,
			// AI tracking data (V6+)
			aiProvider,
			aiVersion,
			modelUsed,
			dataSource,
			processingTime,
			projectsFound,
			citations,
			logs
		} = await request.json();

		if (!conversationId || !sender) {
			return json({ error: 'conversationId and sender are required' }, { status: 400 });
		}

		// Allow empty text for AI messages (streaming use case)
		if (!text && sender !== 'ai') {
			return json({ error: 'text is required for non-AI messages' }, { status: 400 });
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

		// Use getUser() for secure server-side authentication
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		if (userError || !user) {
			return json({ error: 'No authenticated user found' }, { status: 401 });
		}

		// Prepare message data with optional AI tracking fields
		const messageData: any = {
			conversation_id: conversationId,
			text: text || '', // Handle empty text for streaming AI messages
			sender
		};

		// Add AI tracking data if available (V6+)
		if (aiProvider) messageData.ai_provider = aiProvider;
		if (aiVersion) messageData.ai_version = aiVersion;
		if (modelUsed) messageData.model_used = modelUsed;
		if (dataSource) messageData.data_source = dataSource;
		if (processingTime !== undefined) messageData.processing_time = processingTime;
		if (projectsFound !== undefined) messageData.projects_found = projectsFound;
		
		// Add citations if available
		if (citations) messageData.citations = citations;

		// Add logs data if available
		if (logs) {
			messageData.logs_question = logs.question;
			messageData.logs_model_used = logs.model_used;
			messageData.logs_phases = JSON.stringify(logs.phases);
			messageData.logs_total_processing_time_ms = logs.total_processing_time_ms;
			messageData.logs_projects_retrieved = logs.projects_retrieved;
			messageData.logs_projects_processed = logs.projects_processed;
			messageData.logs_success = logs.success;
			messageData.logs_average_relevance_score = logs.average_relevance_score;
		}

		const { data, error } = await supabase.from('message').insert([messageData]).select().single();

		if (error) {
			console.error('Error adding message:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ message: data });
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
