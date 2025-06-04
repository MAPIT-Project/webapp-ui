import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const CORDIS_API_BASE_URL = 'http://localhost:8000';

interface QueryRequest {
  question: string;
  max_results?: number;
  ai_provider?: 'openai' | 'gemini';
}

interface QueryResponse {
  answer: string;
  ai_provider: string;
  model_used: string;
}

interface ErrorResponse {
  detail: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the request body
    const body: QueryRequest = await request.json();
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string') {
      return json(
        { error: 'Missing or invalid required field: question' },
        { status: 400 }
      );
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    // Handle API response
    if (!apiResponse.ok) {
      let errorMessage = `CORDIS API error: ${apiResponse.status}`;
      
      try {
        const errorData: ErrorResponse = await apiResponse.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = `${errorMessage} - ${apiResponse.statusText}`;
      }

      return json(
        { 
          error: 'Failed to get response from CORDIS API',
          details: errorMessage
        },
        { status: apiResponse.status === 404 ? 503 : apiResponse.status }
      );
    }

    // Parse successful response
    const data: QueryResponse = await apiResponse.json();
    
    // Return the response to the client
    return json({
      answer: data.answer,
      ai_provider: data.ai_provider,
      model_used: data.model_used
    });

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