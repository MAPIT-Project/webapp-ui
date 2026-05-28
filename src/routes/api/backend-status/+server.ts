import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ fetch }) => {
	const startTime = Date.now();
	const backendUrl = env.BACKEND_URL || 'http://localhost:8000';
	const healthUrl = `${backendUrl}/api/health`;

	try {
		const response = await fetch(healthUrl, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		const responseTime = Date.now() - startTime;
		const data = await response.json().catch(() => null);

		return new Response(JSON.stringify({
			status: 'connected',
			backend_url: backendUrl,
			health_check_url: healthUrl,
			response_time_ms: responseTime,
			http_status: response.status,
			backend_status: data?.status || 'unknown',
			services: data?.services || {},
			timestamp: new Date().toISOString()
		}), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		const responseTime = Date.now() - startTime;

		return new Response(JSON.stringify({
			status: 'disconnected',
			backend_url: backendUrl,
			health_check_url: healthUrl,
			response_time_ms: responseTime,
			error: error instanceof Error ? error.message : String(error),
			timestamp: new Date().toISOString(),
			troubleshooting: [
				'Check if the backend service is running',
				'Verify BACKEND_URL environment variable is correct',
				'Try: cd ../MAP-IT_SA && make docker-up',
				'Or: curl ' + healthUrl
			]
		}), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
