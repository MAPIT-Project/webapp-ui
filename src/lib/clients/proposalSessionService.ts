import type { 
  ProposalSession, 
  SSEEvent, 
  EvaluationResponse, 
  GapAnalysisResponse 
} from '$lib/types/proposal-session';

class ProposalSessionService {
  private baseUrl = '/api/v4/proposal-session';

  /**
   * Create a new proposal session
   */
  async createSession(data: {
    proposal_id: number;
    call_id: string;
    title: string;
    proposal_type?: string;
  }): Promise<ProposalSession> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get an existing session
   */
  async getSession(sessionId: string): Promise<ProposalSession> {
    const response = await fetch(`${this.baseUrl}/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message with SSE streaming response
   */
  async sendMessageWithStreaming(
    sessionId: string,
    message: string,
    sectionContext: string | null = null,
    onEvent: (event: SSEEvent) => void,
    onComplete?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          section_context: sectionContext
        })
      });

      if (!response.ok) {
        throw new Error(`Stream error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Response body is null');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process buffer for SSE lines
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete part

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '');
              const event = JSON.parse(jsonStr) as SSEEvent;
              onEvent(event);
            } catch (e) {
              console.warn('Failed to parse SSE event:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError?.(error);
    }
  }

  /**
   * Update section content manually
   */
  async updateSection(
    sessionId: string, 
    sectionId: string, 
    content: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/section/${sectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update section');
    }
  }

  /**
   * Update section status manually
   */
  async updateSectionStatus(
    sessionId: string, 
    sectionId: string, 
    status: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/section/${sectionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update section status');
    }
  }

  /**
   * Generate section content via AI (non-chat trigger)
   */
  async generateSection(
    sessionId: string,
    sectionId: string,
    params: {
      guidance?: string;
      word_target?: number;
      style?: string;
    }
  ): Promise<void> { // Note: This actually returns a stream usually, but simpler to use chat for now
    const response = await fetch(`${this.baseUrl}/${sessionId}/section/${sectionId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Failed to start generation');
    }
  }

  /**
   * Evaluate a section
   */
  async evaluateSection(sessionId: string, sectionId: string): Promise<EvaluationResponse> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/section/${sectionId}/evaluate`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to evaluate section');
    }

    return response.json();
  }

  /**
   * Analyze gaps in a section
   */
  async analyzeGaps(sessionId: string, sectionId: string): Promise<GapAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/section/${sectionId}/analyze-gaps`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to analyze gaps');
    }

    return response.json();
  }

  /**
   * Set focus on a section
   */
  async focusSection(sessionId: string, sectionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/${sessionId}/focus/${sectionId}`, {
      method: 'POST'
    });
  }
}

export const proposalSessionService = new ProposalSessionService();
