import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ params, request, fetch, cookies }) => {
  const conversationId = params.conversation_id;
  
  try {
    // Parse the request body to extract the user message
    const requestBody = JSON.parse(await request.text());
    const userMessage = requestBody.message;
    
    // Save the user message to the database
    if (userMessage) {
      await saveUserMessage(conversationId, userMessage, cookies);
    }
    
    // Forward the request to your FastAPI backend
    const backendUrl = `${env.BACKEND_URL || 'http://localhost:8000'}/api/v3/conversation/${conversationId}/message/stream`;
    
    const body = JSON.stringify(requestBody);
    
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
    
    // Create a transform stream to intercept and process the SSE data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // Track the accumulated AI response and metadata
    let accumulatedResponse = '';
    let completionMetadata: any = null;
    let isComplete = false;
    
    // Process the stream
    const processStream = async () => {
      const reader = response.body?.getReader();
      if (!reader) {
        writer.close();
        return;
      }
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Handle different event types
                if (data.type === 'token') {
                  accumulatedResponse += data.content || '';
                } else if (data.type === 'complete') {
                  // Store the completion metadata
                  completionMetadata = data;
                  isComplete = true;
                }
                
                // Forward all events to the client
                writer.write(encoder.encode(line + '\n'));
              } catch (e) {
                // Forward invalid JSON as-is
                writer.write(encoder.encode(line + '\n'));
              }
            } else {
              // Forward non-data lines as-is
              writer.write(encoder.encode(line + '\n'));
            }
          }
        }
        
        // Save the AI message to database when streaming is complete
        if (isComplete && completionMetadata && accumulatedResponse) {
          await saveAIMessage(conversationId, accumulatedResponse, completionMetadata, cookies);
        }
        
        writer.close();
      } catch (err) {
        console.error('Error processing stream:', err);
        writer.close();
      }
    };
    
    // Start processing the stream in the background
    processStream();
    
    // Return the transformed stream to the client
    return new Response(readable, {
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

// Helper function to save user message to database
async function saveUserMessage(conversationId: string, text: string, cookies: any) {
  try {
    const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get: (key: string) => cookies.get(key),
        set: (key: string, value: string, options: any) => {
          cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key: string, options: any) => {
          cookies.delete(key, { ...options, path: '/' });
        }
      }
    });

    // Use getUser() for secure server-side authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found when saving user message');
      return;
    }

    // Prepare message data
    const messageData: any = {
      conversation_id: conversationId,
      text,
      sender: 'user'
    };

    const { data, error } = await supabase.from('message').insert([messageData]).select().single();

    if (error) {
      console.error('Error saving user message:', error);
    } else {
      console.log('User message saved successfully with ID:', data.id);
    }
  } catch (error) {
    console.error('Error saving user message:', error);
  }
}

// Helper function to save AI message to database
async function saveAIMessage(conversationId: string, text: string, metadata: any, cookies: any) {
  try {
    const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get: (key: string) => cookies.get(key),
        set: (key: string, value: string, options: any) => {
          cookies.set(key, value, { ...options, path: '/' });
        },
        remove: (key: string, options: any) => {
          cookies.delete(key, { ...options, path: '/' });
        }
      }
    });

    // Use getUser() for secure server-side authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found when saving AI message');
      return;
    }

    // Prepare message data with AI tracking fields
    const messageData: any = {
      conversation_id: conversationId,
      text,
      sender: 'ai'
    };

    // Add AI tracking data if available
    if (metadata.ai_provider) messageData.ai_provider = metadata.ai_provider;
    if (metadata.ai_version) messageData.ai_version = metadata.ai_version;
    if (metadata.model_used) messageData.model_used = metadata.model_used;
    if (metadata.data_source) messageData.data_source = metadata.data_source;
    if (metadata.processing_time !== undefined) messageData.processing_time = metadata.processing_time;
    if (metadata.projects_found !== undefined) messageData.projects_found = metadata.projects_found;
    
    // Add citations if available
    if (metadata.citations && metadata.citations.length > 0) {
      messageData.citations = metadata.citations;
    }

    // Add logs data if available
    if (metadata.logs) {
      messageData.logs_question = metadata.logs.question;
      messageData.logs_model_used = metadata.logs.model_used;
      messageData.logs_phases = metadata.logs.phases ? JSON.stringify(metadata.logs.phases) : null;
      messageData.logs_total_processing_time_ms = metadata.logs.total_processing_time_ms;
      messageData.logs_projects_retrieved = metadata.logs.projects_retrieved;
      messageData.logs_projects_processed = metadata.logs.projects_processed;
      messageData.logs_success = metadata.logs.success;
      messageData.logs_average_relevance_score = metadata.logs.average_relevance_score?.toString();
    } else if (metadata.metadata) {
      // Handle V3 metadata format (wrapped in a metadata property)
      const v3Meta = metadata.metadata;
      
      // Map V3 fields to existing columns where possible
      if (v3Meta.processing_time_ms) {
        messageData.logs_total_processing_time_ms = v3Meta.processing_time_ms;
      }
      
      // Store reasoning steps and other V3 info in logs_phases as JSON
      const logsPhasesData = {
        architecture: v3Meta.architecture,
        iterations: v3Meta.iterations,
        tools_used: v3Meta.tools_used,
        reasoning_steps: v3Meta.reasoning_steps,
        confidence: v3Meta.confidence
      };
      messageData.logs_phases = JSON.stringify(logsPhasesData);
      
      // Assume success if we got here
      messageData.logs_success = true;
    } else {
      // Handle V3 metadata format (unwrapped)
      if (metadata.processing_time_ms) {
        messageData.logs_total_processing_time_ms = metadata.processing_time_ms;
      }
      
      if (metadata.reasoning_steps || metadata.architecture) {
        const logsPhasesData = {
            architecture: metadata.architecture,
            iterations: metadata.iterations,
            tools_used: metadata.tools_used,
            reasoning_steps: metadata.reasoning_steps,
            confidence: metadata.confidence
        };
        messageData.logs_phases = JSON.stringify(logsPhasesData);
        messageData.logs_success = true;
      }
    }

    const { data, error } = await supabase.from('message').insert([messageData]).select().single();

    if (error) {
      console.error('Error saving AI message:', error);
    } else {
      console.log('AI message saved successfully with ID:', data.id);
    }
  } catch (error) {
    console.error('Error saving AI message:', error);
  }
}