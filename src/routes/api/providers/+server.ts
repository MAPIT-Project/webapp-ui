import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://localhost:18000';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		// Fetch data from the actual AI service endpoint
		const response = await fetch(`${BACKEND_URL}/api/providers`);

		if (!response.ok) {
			// If the AI service returns an error, relay it
			const errorData = await response
				.json()
				.catch(() => ({ error: 'Failed to parse error from AI service' }));
			return json(
				{
					error: `AI service error: ${response.status}`,
					details: errorData
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Proxy server error fetching providers:', error);
		return json(
			{
				error: 'Internal server error while fetching providers',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
