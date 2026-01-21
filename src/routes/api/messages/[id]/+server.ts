import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const messageId = params.id;
		const {
			text,
			// AI tracking data (V6+)
			aiProvider,
			aiVersion,
			modelUsed,
			dataSource,
			processingTime,
			projectsFound,
			logs
		} = await request.json();

		if (!messageId || !text) {
			return json({ error: 'Message ID and text are required' }, { status: 400 });
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

		// Prepare update data with optional AI tracking fields
		const updateData: any = {
			text,
			updated_at: new Date().toISOString()
		};

		// Add AI tracking data if available (V6+)
		if (aiProvider) updateData.ai_provider = aiProvider;
		if (aiVersion) updateData.ai_version = aiVersion;
		if (modelUsed) updateData.model_used = modelUsed;
		if (dataSource) updateData.data_source = dataSource;
		if (processingTime !== undefined) updateData.processing_time = processingTime;
		if (projectsFound !== undefined) updateData.projects_found = projectsFound;

		// Add logs data if available
		if (logs) {
			updateData.logs_question = logs.question;
			updateData.logs_model_used = logs.model_used;
			updateData.logs_phases = JSON.stringify(logs.phases);
			updateData.logs_total_processing_time_ms = logs.total_processing_time_ms;
			updateData.logs_projects_retrieved = logs.projects_retrieved;
			updateData.logs_projects_processed = logs.projects_processed;
			updateData.logs_success = logs.success;
			updateData.logs_average_relevance_score = logs.average_relevance_score;
		}

		const { data, error } = await supabase
			.from('message')
			.update(updateData)
			.eq('id', messageId)
			.select()
			.single();

		if (error) {
			console.error('Error updating message:', error);
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
