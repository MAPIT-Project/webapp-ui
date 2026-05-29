import type { Citation } from '$lib/types/schema';

export interface StreamingEventData {
  type: 'progress' | 'token' | 'complete' | 'error' | 'status' | 'response' | 'agent_thinking' | 'tool_call' | 'tool_result' | 'agent_iteration' | 'conversation_name';
  stage?: string;
  message?: string;
  content?: string;
  error?: string;
  details?: string;
  citations?: Citation[];
  step?: number;
  total_steps?: number;
  download_url?: string;
  file_type?: 'docx' | 'xlsx' | 'zip';
  file_name?: string;
  package_contents?: string[];
  // V3 specific fields
  iteration?: number;
  thought?: string;
  action?: string; // agent_thinking action
  tool_name?: string;
  parameters?: any;
  reasoning?: string; // tool_call reasoning
  success?: boolean;
  result_summary?: string;
  result_count?: number; // tool_result count
  execution_time_ms?: number; // tool_result time
  total_iterations?: number;
  needs_more_info?: boolean;
  tools_called?: string[];
  // Conversation naming
  name?: string;
  conversation_id?: number;
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
    onError?: (error: string) => void,
    onAgentEvent?: (event: StreamingEventData) => void,
    onConversationName?: (name: string, conversationId: number) => void
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
      let buffer = '';

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return false;
        try {
          const data: StreamingEventData = JSON.parse(line.slice(6));

          switch (data.type) {
            case 'progress':
              // Handle progress messages with step information
              if (data.step !== undefined && data.total_steps) {
                // This is an export progress message
                onProgress?.(
                  data.stage || 'exporting',
                  data.message || '',
                  {
                    step: data.step,
                    totalSteps: data.total_steps,
                    type: 'export'
                  }
                );
              } else {
                // Regular progress message
                onProgress?.(
                  data.stage || 'processing',
                  data.message || '',
                  {
                    routingDecision: (data as any).routing_decision,
                    intentConfidence: (data as any).intent_confidence
                  }
                );
              }
              break;

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
            
            case 'conversation_name':
              if (data.name && data.conversation_id) {
                onConversationName?.(data.name, data.conversation_id);
              }
              break;

            case 'agent_thinking':
            case 'tool_call':
            case 'tool_result':
            case 'agent_iteration':
              onAgentEvent?.(data);
              break;

            case 'response':
              // Handle export response with download info
              onProgress?.(
                'export_complete',
                'Export ready for download',
                {
                  downloadUrl: data.download_url,
                  fileType: data.file_type,
                  fileName: data.file_name,
                  packageContents: data.package_contents,
                  type: 'export_response'
                }
              );
              break;

            case 'token':
            case 'chunk':
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
              return true; // End the stream

            case 'error':
              // Handle error - pass error to parent component
              const errorMessage = data.details || data.error || 'An error occurred while processing your request';
              console.log('Streaming error received:', data.error, 'Details:', data.details);
              console.log('Passing error to parent component');
              onError?.(errorMessage);
              return true; // End the stream
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', line);
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const finished = processLine(line);
          if (finished) return;
        }
      }

      // Process any trailing bytes remaining in the buffer
      if (buffer.length > 0) {
        processLine(buffer);
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