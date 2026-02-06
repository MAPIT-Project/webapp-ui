import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ params, request }) => {
  const { conversation_id } = params;
  
  try {
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:8000'}/api/conversation/${conversation_id}/reset-context`;
    
    // Forward headers (excluding host and connection headers)
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        headers.set(key, value);
      }
    }
    
    // Add CORS headers if needed
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return json(
        { error: 'Failed to reset conversation context on backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying reset context request:', error);
    return json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    );
  }
};