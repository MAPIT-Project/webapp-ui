import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
  const { conversation_id } = params;
  
  try {
    // Forward the request to the backend API on localhost:8000
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v2/conversation/${conversation_id}/message`;
    
    // Get the request body
    const body = await request.json();
    
    // Forward headers (excluding host and connection headers)
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        headers.set(key, value);
      }
    }
    
    // Add content-type for POST requests
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    console.log(`Proxying request to: ${backendUrl}`);
    
    // Try a simpler fetch without complex headers
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return json(
        { error: `Failed to send message to backend: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying conversation message request:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
      console.error('Error name:', error.name);
      console.error('Error cause:', error.cause);
      return json(
        { error: `Failed to connect to backend service: ${error.message} (${error.name})` },
        { status: 500 }
      );
    } else {
      console.error('Unknown error type:', error);
      return json(
        { error: 'Failed to connect to backend service: Unknown error' },
        { status: 500 }
      );
    }
  }
};