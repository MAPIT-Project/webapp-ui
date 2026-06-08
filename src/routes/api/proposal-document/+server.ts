import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://localhost:18000';

async function proxyRequest(event: any) {
  const { request, fetch } = event;
  
  // Extract query params if any
  const urlObj = new URL(request.url);
  const searchParams = urlObj.search;
  
  const targetUrl = `${BACKEND_URL}/api/proposal-document${searchParams}`;

  try {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');

    const options: RequestInit = {
      method: request.method,
      headers,
      duplex: 'half' // Required for streaming bodies in some environments
    } as any;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      options.body = request.body;
    }

    const response = await fetch(targetUrl, options);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (err) {
    console.error(`Proxy error for /api/proposal-document:`, err);
    throw error(502, 'Bad Gateway');
  }
}

export const GET: RequestHandler = proxyRequest;
export const POST: RequestHandler = proxyRequest;
export const PUT: RequestHandler = proxyRequest;
export const PATCH: RequestHandler = proxyRequest;
export const DELETE: RequestHandler = proxyRequest;