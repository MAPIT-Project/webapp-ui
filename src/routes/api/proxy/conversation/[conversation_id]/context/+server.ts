import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, request }) => {
  const { conversation_id } = params;
  
  try {
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:8000'}/api/v3/conversation/${conversation_id}/context`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return json(
        { error: 'Failed to fetch conversation context from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying conversation context request:', error);
    return json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ params, request }) => {
  const { conversation_id } = params;
  
  try {
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:8000'}/api/v3/conversation/${conversation_id}/context`;
    
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
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      return json(
        { error: 'Failed to update conversation context on backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying conversation context request:', error);
    return json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    );
  }
};