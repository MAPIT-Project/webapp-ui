import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const conversationId = params.conversation_id;
  
  try {
    // Forward the request to your FastAPI backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v2/conversation/${conversationId}/message/stream`;
    
    const body = await request.text();
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body
    });
    
    if (!response.ok) {
      throw error(response.status, `Backend error: ${response.statusText}`);
    }
    
    // Return the streaming response
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