import { addStreamingAIMessage } from './conversationService';

export interface StreamingEventData {
  type: 'progress' | 'token' | 'complete' | 'error' | 'status';
  stage?: string;
  message?: string;
  content?: string;
  error?: string;
  details?: string;
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
      // First create an empty AI message in the database
      const { updateMessage } = await addStreamingAIMessage(conversationId, '');

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
                    projects_discussed: data.projects_discussed
                  };
                  console.log('Final database update with complete message and metadata');
                  try {
                    await updateMessage(accumulatedContent, aiResponseData);
                    console.log('Final database update successful');
                  } catch (error) {
                    console.error('Final database update failed:', error);
                  }
                  onComplete?.(data);
                  return; // End the stream

                case 'error':
                  // Handle error - save error message to database and clean up
                  const errorMessage = data.details || data.error || 'An error occurred while processing your request';
                  console.log('Streaming error received:', data.error, 'Details:', data.details);

                  try {
                    // Save the error message to the database
                    const errorResponseData = {
                      ai_provider: 'error',
                      ai_version: 'error',
                      model_used: 'error',
                      data_source: 'error',
                      processing_time: 0,
                      projects_found: 0,
                      logs: {
                        question: message,
                        model_used: 'error',
                        phases: ['error'],
                        total_processing_time_ms: 0,
                        projects_retrieved: 0,
                        projects_processed: 0,
                        success: false,
                        average_relevance_score: 0
                      },
                      context_used: false,
                      resolved_question: '',
                      follow_up_suggestions: [],
                      projects_discussed: []
                    };

                    await updateMessage(errorMessage, errorResponseData);
                    console.log('Error message saved to database');
                  } catch (saveError) {
                    console.error('Failed to save error message to database:', saveError);
                  }

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