import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createProxyToken } from '$lib/server/jwt';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const conversationId = params.conversation_id;

  try {
    const requestBody = JSON.parse(await request.text());

    // Verify user is authenticated with Supabase (for session validation)
    const supabase = createSupabaseServerClient(cookies);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      throw error(401, 'Unauthorized: No valid session');
    }

    // Get the actual user ID from Supabase session
    const userId = session.user.id;

    // Generate a JWT token for backend authentication
    const backendToken = await createProxyToken();

    // Transform request body to match backend V3 MessageRequest schema
    // Frontend sends: { message, include_context }
    const backendBody = {
      message: requestBody.message,
      include_context: requestBody.include_context !== false,
    };

    // Forward to the correct backend endpoint with JWT auth
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:18000'}/api/v3/conversation/${conversationId}/message/stream`;

    const response = await globalThis.fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
      },
      body: JSON.stringify(backendBody)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Backend error ${response.status}: ${errorText}`);
      throw error(response.status, `Backend error: ${response.statusText} - ${errorText}`);
    }

    // Stream the response directly to the client
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
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Proxy error:', err);
    throw error(500, `Failed to proxy streaming request: ${err instanceof Error ? err.message : String(err)}`);
  }
};
