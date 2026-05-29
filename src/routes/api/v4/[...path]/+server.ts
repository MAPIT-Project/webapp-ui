import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://localhost:18000';

async function proxyRequest(event: any) {
  const { params, request, fetch } = event;
  const path = params.path;
  const targetUrl = `${BACKEND_URL}/api/v4/${path}${request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : ''}`;

  try {
    const headers = new Headers(request.headers);
    // Remove headers that might cause issues
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
    console.error(`Proxy error for ${path}:`, err);
    throw error(502, 'Bad Gateway');
  }
}

export const GET: RequestHandler = proxyRequest;
export const POST: RequestHandler = proxyRequest;
export const PUT: RequestHandler = proxyRequest;
export const PATCH: RequestHandler = proxyRequest;
export const DELETE: RequestHandler = proxyRequest;
