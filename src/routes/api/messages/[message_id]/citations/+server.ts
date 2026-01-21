import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Citation } from '$lib/types/schema';

// GET /api/messages/[message_id]/citations
// Retrieves citations for a specific message
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const messageId = parseInt(params.message_id);
		
		if (isNaN(messageId)) {
			return json({ error: 'Invalid message ID' }, { status: 400 });
		}

		// Create Supabase client
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

		// Get the message with citations
		const { data, error } = await supabase
			.from('message')
			.select('citations')
			.eq('id', messageId)
			.single();

		if (error) {
			console.error('Error fetching message:', error);
			return json({ error: 'Message not found', details: error.message }, { status: 404 });
		}

		const citations = data.citations as Citation[] || [];

		return json({ citations });
	} catch (error) {
		console.error('Error retrieving citations:', error);
		return json({ 
			error: 'Failed to retrieve citations', 
			details: error instanceof Error ? error.message : String(error) 
		}, { status: 500 });
	}
};

// POST /api/messages/[message_id]/citations
// Saves citations for a specific message
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const messageId = parseInt(params.message_id);
		
		if (isNaN(messageId)) {
			return json({ error: 'Invalid message ID' }, { status: 400 });
		}

		// Create Supabase client
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

		const { citations } = await request.json() as { citations: Citation[] };

		if (!citations || !Array.isArray(citations)) {
			return json({ error: 'Invalid citations data' }, { status: 400 });
		}

		// First, try to reload the schema
		await supabase.rpc('reload_schema');
		
		// Add a small delay to ensure the schema is reloaded
		await new Promise(resolve => setTimeout(resolve, 500));

		// Update the message with citations
		const { error } = await supabase
			.from('message')
			.update({ citations })
			.eq('id', messageId);

		if (error) {
			console.error('Error updating message with citations:', error);
			return json({ error: 'Failed to save citations', details: error.message }, { status: 500 });
		}

		return json({ success: true, citations });
	} catch (error) {
		console.error('Error saving citations:', error);
		return json({ 
			error: 'Failed to save citations', 
			details: error instanceof Error ? error.message : String(error) 
		}, { status: 500 });
	}
};