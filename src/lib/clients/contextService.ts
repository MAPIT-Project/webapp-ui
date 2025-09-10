import type { ProjectReference } from '$lib/stores/conversationContextStore';

export interface MessageRequest {
  message: string;
  include_context?: boolean;
}

export interface MessageResponse {
  response: string;
  context_used: boolean;
  resolved_question?: string;
  follow_up_suggestions: string[];
  projects_discussed: ProjectReference[];
  processing_time: number;
}

export interface ConversationContextData {
  conversation_id: number;
  message_count: number;
  projects_discussed: ProjectReference[];
  topics: string[];
  last_query_type: string;
}

/**
 * Send a contextual message to a conversation
 */
export async function sendContextualMessage(
  conversationId: number,
  message: string,
  includeContext: boolean = true
): Promise<MessageResponse> {
  const response = await fetch(`/api/proxy/conversation/${conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      include_context: includeContext
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the current context for a conversation
 */
export async function getConversationContext(conversationId: number): Promise<ConversationContextData> {
  const response = await fetch(`/api/proxy/conversation/${conversationId}/context`);
  
  if (!response.ok) {
    throw new Error(`Failed to get context: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Reset the context for a conversation
 */
export async function resetConversationContext(conversationId: number): Promise<void> {
  const response = await fetch(`/api/proxy/conversation/${conversationId}/reset-context`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reset context: ${response.statusText}`);
  }
}

/**
 * Generate follow-up suggestions based on conversation context
 */
export async function generateFollowUpSuggestions(
  conversationId: number,
  lastResponse: any
): Promise<string[]> {
  const response = await fetch(`/api/proxy/conversation/${conversationId}/follow-ups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      last_response: lastResponse
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate follow-ups: ${response.statusText}`);
  }

  const data = await response.json();
  return data.suggestions || [];
}