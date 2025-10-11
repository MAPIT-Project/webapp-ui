import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Get the download URL from query parameter
		const searchParams = new URL(url).searchParams;
		const downloadUrl = searchParams.get('url');

		if (!downloadUrl) {
			return error(400, 'Download URL is required');
		}

		// Validate the URL to prevent SSRF attacks
		const allowedHosts = [
			'localhost',
			'127.0.0.1',
			// Add any other internal hosts your AI API might use
		];

		const urlObj = new URL(downloadUrl);
		const isAllowed = allowedHosts.includes(urlObj.hostname) ||
						  urlObj.hostname.endsWith('.localhost') ||
						  urlObj.hostname.endsWith('.127.0.0.1');

		if (!isAllowed) {
			return error(403, 'Download URL not allowed');
		}

		// Forward the request to the actual download URL
		const response = await fetch(downloadUrl, {
			method: request.method,
			headers: {
				// Forward only safe headers
				'Accept': request.headers.get('Accept') || '*/*',
				'User-Agent': request.headers.get('User-Agent') || 'MapIt-WebApp/1.0',
				// Don't forward auth headers to prevent leakage
			}
		});

		if (!response.ok) {
			console.error('Download proxy error:', response.status, response.statusText);
			return error(response.status, `Download failed: ${response.statusText}`);
		}

		// Get content type and disposition
		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		const contentDisposition = response.headers.get('content-disposition') || '';

		// Get file size if available
		const contentLength = response.headers.get('content-length');

		// Get the file as a buffer
		const arrayBuffer = await response.arrayBuffer();

		// Create a new response with the file data
		const newResponse = new Response(arrayBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': contentDisposition,
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
				// Add CORS headers
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type',
			}
		});

		return newResponse;

	} catch (err) {
		console.error('Download proxy error:', err);
		return error(500, `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};

// Handle CORS preflight requests
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		}
	});
};