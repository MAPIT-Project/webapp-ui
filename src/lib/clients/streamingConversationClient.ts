import type { Citation } from '$lib/types/schema';

export interface StreamingEventData {
  type: 'progress' | 'token' | 'complete' | 'error' | 'status';
  stage?: string;
  message?: string;
  content?: string;
  error?: string;
  details?: string;
  citations?: Citation[];
  [key: string]: any;
}

export class StreamingConversationClient {
  private eventSource: EventSource | null = null;

  async sendStreamingMessage(
    conversationId: number,
    message: string,
    includeContext: boolean = true,
    onProgress?: (stage: string, message: string, extras?: any) => void,
    onToken?: (content: string) => void,
    onComplete?: (metadata: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {

    // Close any existing connection
    this.closeConnection();

    try {
      // Create the streaming request
      const url = `/api/proxy/conversation/${conversationId}/message/stream`;
      const requestBody = {
        message,
        include_context: includeContext
      };

      // Use fetch to initiate the stream
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let accumulatedContent = '';
      let accumulatedCitations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingEventData = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'progress':
                case 'status':
                  onProgress?.(
                    data.stage || 'processing',
                    data.message || '',
                    {
                      routingDecision: (data as any).routing_decision,
                      intentConfidence: (data as any).intent_confidence
                    }
                  );
                  break;

                case 'token':
                  accumulatedContent += data.content || '';
                  onToken?.(data.content || '');
                  // Don't update database incrementally - too many requests cause issues
                  // We'll update only at the end
                  break;

                case 'complete':
                  // Accumulate citations if provided
                  if (data.citations) {
                    accumulatedCitations = data.citations;
                  }
                  
                  // Final update with complete metadata - map to AIResponseData format
                  const aiResponseData = {
                    ai_provider: data.ai_provider,
                    ai_version: data.ai_version,
                    model_used: data.model_used,
                    data_source: data.data_source,
                    processing_time: data.processing_time,
                    projects_found: data.projects_found,
                    logs: data.logs,
                    context_used: data.context_used,
                    resolved_question: data.resolved_question,
                    follow_up_suggestions: data.follow_up_suggestions,
                    projects_discussed: data.projects_discussed,
                    citations: accumulatedCitations
                  };
                  console.log('Passing complete metadata to parent component');
                  onComplete?.(data);
                  return; // End the stream

                case 'error':
                  // Handle error - pass error to parent component
                  const errorMessage = data.details || data.error || 'An error occurred while processing your request';
                  console.log('Streaming error received:', data.error, 'Details:', data.details);
                  console.log('Passing error to parent component');
                  onError?.(errorMessage);
                  return; // End the stream
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  }

  closeConnection() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const streamingClient = new StreamingConversationClient();