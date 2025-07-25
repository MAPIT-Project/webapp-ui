import type { RequestHandler } from '@sveltejs/kit';

const CORDIS_API_BASE_URL = 'http://localhost:8000';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string') {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', error: 'Missing or invalid required field: question' })}\n\n`,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      );
    }

    // Prepare the request payload for the FastAPI streaming endpoint
    const apiPayload = {
      question: body.question.trim(),
      max_results: body.max_results || 5,
      ai_provider: body.ai_provider || 'gemini',
      ai_version: body.ai_version || 'V6',
      use_local_db: body.use_local_db
    };

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        const safeClose = () => {
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        };

        try {
          const response = await fetch(`${CORDIS_API_BASE_URL}/api/query/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
          });

          if (!response.ok) {
            const errorData = await response.text();
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'FastAPI streaming endpoint error',
              details: errorData 
            })}\n\n`);
            safeClose();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to create stream reader' 
            })}\n\n`);
            safeClose();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }

              // Forward the chunk
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
            safeClose();
          }

        } catch (error) {
          console.error('Streaming error:', error);
          try {
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Streaming connection failed',
              details: error instanceof Error ? error.message : String(error)
            })}\n\n`);
          } catch (enqueueError) {
            console.error('Failed to enqueue error message:', enqueueError);
          }
          safeClose();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error in streaming endpoint:', error);
    return new Response(
      `data: ${JSON.stringify({ 
        type: 'error', 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      })}\n\n`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const question = url.searchParams.get('question');
    const maxResults = url.searchParams.get('max_results') || '5';
    const aiProvider = url.searchParams.get('ai_provider') || 'gemini';
    const aiVersion = url.searchParams.get('ai_version') || 'V8';
    const useLocalDb = url.searchParams.get('use_local_db');
    
    if (!question) {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', error: 'Missing required parameter: question' })}\n\n`,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      );
    }

    // Prepare the request payload
    const apiPayload = {
      question: question.trim(),
      max_results: parseInt(maxResults),
      ai_provider: aiProvider,
      ai_version: aiVersion,
      use_local_db: useLocalDb ? useLocalDb === 'true' : undefined
    };

    // Create a streaming response for GET requests (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        const safeClose = () => {
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        };

        try {
          const response = await fetch(`${CORDIS_API_BASE_URL}/api/query/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
          });

          if (!response.ok) {
            const errorData = await response.text();
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'FastAPI streaming endpoint error',
              details: errorData 
            })}\n\n`);
            safeClose();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to create stream reader' 
            })}\n\n`);
            safeClose();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }

              // Forward the chunk
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
            safeClose();
          }

        } catch (error) {
          console.error('Streaming error:', error);
          try {
            controller.enqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Streaming connection failed',
              details: error instanceof Error ? error.message : String(error)
            })}\n\n`);
          } catch (enqueueError) {
            console.error('Failed to enqueue error message:', enqueueError);
          }
          safeClose();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error in streaming endpoint:', error);
    return new Response(
      `data: ${JSON.stringify({ 
        type: 'error', 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      })}\n\n`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  }
}; 