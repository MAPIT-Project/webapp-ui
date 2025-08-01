import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { aiQueryRateLimit, extractClientIP } from '$lib/server/rateLimit';

const CORDIS_API_BASE_URL = 'http://localhost:8000';

interface QueryRequest {
	question: string;
	max_results?: number;
	ai_provider?: 'openai' | 'gemini';
}

interface LogsData {
	question: string;
	model_used: string;
	phases: string[];
	total_processing_time_ms: number;
	projects_retrieved: number;
	projects_processed: number;
	success: boolean;
	average_relevance_score: number;
}

interface QueryResponse {
	answer: string;
	ai_provider: string;
	ai_version?: string;
	model_used: string;
	data_source?: string;
	processing_time?: number;
	projects_found?: number;
	logs?: LogsData;
}

interface ErrorResponse {
	detail: string;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// Apply rate limiting for AI queries
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
					{ error: 'Too many AI queries. Please wait before making another request.' },
					{ status: 429 }
				);
			}
		}
		return json(
			{ error: 'Too many AI queries. Please wait before making another request.' },
			{ status: 429 }
		);
	}

	try {
		// Parse the request body
		const body: QueryRequest = await request.json();

		// Validate required fields
		if (!body.question || typeof body.question !== 'string') {
			return json({ error: 'Missing or invalid required field: question' }, { status: 400 });
		}

		// Prepare the request payload for the CORDIS API
		const apiPayload: QueryRequest = {
			question: body.question.trim(),
			max_results: body.max_results || 5
		};

		// Add AI provider if specified
		if (body.ai_provider && ['openai', 'gemini'].includes(body.ai_provider)) {
			apiPayload.ai_provider = body.ai_provider;
		}

		// Make request to the CORDIS API
		const apiResponse = await fetch(`${CORDIS_API_BASE_URL}/api/query`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(apiPayload)
		});

		// Handle API response
		if (!apiResponse.ok) {
			let errorMessage = `CORDIS API error: ${apiResponse.status}`;
			let errorDetails = apiResponse.statusText;

			try {
				const errorData = await apiResponse.json();
				// Check for different error response formats
				if (errorData.detail) {
					// FastAPI standard error format
					errorDetails = errorData.detail;
				} else if (errorData.details) {
					// Custom error format from the FastAPI app
					errorDetails = errorData.details;
				} else if (errorData.error && errorData.details) {
					// The exact format used in the FastAPI app
					errorDetails = errorData.details;
				} else if (typeof errorData === 'string') {
					errorDetails = errorData;
				} else {
					// Fallback to JSON string if structure is unknown
					errorDetails = JSON.stringify(errorData);
				}
			} catch (parseError) {
				// If we can't parse the error response, try to get it as text
				try {
					errorDetails = await apiResponse.text();
				} catch {
					errorDetails = `${apiResponse.status} - ${apiResponse.statusText}`;
				}
			}

			return json(
				{
					error: 'Failed to get response from CORDIS API',
					details: errorDetails
				},
				{ status: apiResponse.status === 404 ? 503 : apiResponse.status }
			);
		}

		// Parse successful response
		const data: QueryResponse = await apiResponse.json();

		// Handle the case where the answer field contains a stringified object
		let cleanAnswer = data.answer;
		try {
			// Check if the answer is a stringified Python dictionary/object
			if (
				typeof data.answer === 'string' &&
				data.answer.startsWith('{') &&
				data.answer.includes("'answer':")
			) {
				// Simple extraction: find the answer content between 'answer': " and ", 'logs':
				const startMarker = "'answer': \"";
				const endMarker = "\", 'logs':";

				const startIndex = data.answer.indexOf(startMarker);
				const endIndex = data.answer.indexOf(endMarker);

				if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
					const extractedContent = data.answer.substring(startIndex + startMarker.length, endIndex);

					// Unescape the extracted content
					cleanAnswer = extractedContent
						.replace(/\\"/g, '"')
						.replace(/\\n/g, '\n')
						.replace(/\\t/g, '\t')
						.replace(/\\r/g, '\r')
						.replace(/\\\\/g, '\\');
				}
			}
		} catch (parseError) {
			console.warn('Failed to parse stringified answer, using original:', parseError);
			// Keep the original answer if parsing fails
		}

		// Add rate limit headers to successful response
		const rateLimitInfo = aiQueryRateLimit.info(ip);

		// Return the response to the client with all tracking data
		return json(
			{
				answer: cleanAnswer,
				ai_provider: data.ai_provider,
				ai_version: data.ai_version,
				model_used: data.model_used,
				data_source: data.data_source,
				processing_time: data.processing_time,
				projects_found: data.projects_found,
				logs: data.logs
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
		console.error('Error in query endpoint:', error);

		// Handle specific fetch errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return json(
				{
					error: 'Unable to connect to CORDIS API',
					details: 'Make sure the CORDIS API server is running on localhost:8000'
				},
				{ status: 503 }
			);
		}

		// Handle JSON parsing errors
		if (error instanceof SyntaxError) {
			return json(
				{
					error: 'Invalid request format',
					details: 'Request body must be valid JSON'
				},
				{ status: 400 }
			);
		}

		// Generic error handler
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
