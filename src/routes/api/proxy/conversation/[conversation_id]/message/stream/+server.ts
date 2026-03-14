import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const conversationId = params.conversation_id;
  
  try {
    const requestBody = JSON.parse(await request.text());
    
    // Forward the request to the FastAPI backend (which handles message persistence)
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:8000'}/api/v3/conversation/${conversationId}/message/stream`;
    
    const response = await globalThis.fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw error(response.status, `Backend error: ${response.statusText}`);
    }
    
    // Stream the response directly to the client — no interception needed
    // since the AI API handles saving messages
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
    
  } catch (err) {
    console.error('Proxy error:', err);
    throw error(500, 'Failed to proxy streaming request');
  }
};
