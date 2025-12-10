import type { 
  Proposal, 
  ProposalSection, 
  ProposalProgress, 
  SectionUpdateRequest, 
  SectionUpdateResponse,
  ProposalStreamingEventData
} from '$lib/types/proposal';
import { streamingClient } from './streamingConversationClient';

/**
 * Service for managing proposal documents and sections
 */
export class ProposalService {
  private baseUrl = '/api';

  /**
   * Get complete proposal document with all sections
   */
  async getProposalDocument(proposalId: number): Promise<Proposal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document/${proposalId}`);
      
      if (!response.ok) {
        console.error('Error loading proposal document:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data as Proposal;
    } catch (error) {
      console.error('Error fetching proposal document:', error);
      return null;
    }
  }

  /**
   * Get a single section by ID
   */
  async getProposalSection(proposalId: number, sectionId: string): Promise<ProposalSection | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document/${proposalId}/section/${sectionId}`);
      
      if (!response.ok) {
        console.error('Error loading proposal section:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data as ProposalSection;
    } catch (error) {
      console.error('Error fetching proposal section:', error);
      return null;
    }
  }

  /**
   * Update section content
   */
  async updateProposalSection(
    proposalId: number, 
    sectionId: string, 
    update: SectionUpdateRequest
  ): Promise<SectionUpdateResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document/${proposalId}/section/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
      });
      
      if (!response.ok) {
        console.error('Error updating proposal section:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data as SectionUpdateResponse;
    } catch (error) {
      console.error('Error updating proposal section:', error);
      return null;
    }
  }

  /**
   * Get progress information for a proposal
   */
  async getProposalProgress(proposalId: number): Promise<ProposalProgress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document/${proposalId}/progress`);
      
      if (!response.ok) {
        console.error('Error loading proposal progress:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data.overall_progress as ProposalProgress;
    } catch (error) {
      console.error('Error fetching proposal progress:', error);
      return null;
    }
  }

  /**
   * Create a new proposal template
   */
  async createProposalTemplate(callId: string, userId: string): Promise<{ proposal_id: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal/generate-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          call_id: callId,
          user_id: userId
        })
      });
      
      if (!response.ok) {
        console.error('Error creating proposal template:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data as { proposal_id: number };
    } catch (error) {
      console.error('Error creating proposal template:', error);
      return null;
    }
  }

  /**
   * Create a new proposal
   */
  async createProposal(data: {
    call_id: string;
    proposal_title: string;
    proposal_acronym?: string;
    proposal_type?: string;
  }): Promise<{ proposal: Proposal; success: boolean } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error('Error creating proposal:', response.status, response.statusText);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating proposal:', error);
      return null;
    }
  }

  /**
   * Get all proposals
   */
  async getProposals(): Promise<Proposal[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document`);
      
      if (!response.ok) {
        console.error('Error fetching proposals:', response.status, response.statusText);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return null;
    }
  }

  /**
   * Lookup call details (simulates external API check)
   */
  async lookupCall(callId: string): Promise<{ title: string; type: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proposal-document/lookup-call?call_id=${encodeURIComponent(callId)}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error looking up call:', error);
      return null;
    }
  }

  /**
   * Stream proposal editing through conversation API
   */
  async streamProposalEdit(
    conversationId: number,
    message: string,
    userId: string,
    onProgress?: (stage: string, message: string, extras?: any) => void,
    onToken?: (content: string) => void,
    onComplete?: (data: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      await streamingClient.sendStreamingMessage(
        conversationId,
        message,
        true, // include context
        onProgress,
        onToken,
        onComplete,
        onError
      );
    } catch (error) {
      console.error('Error streaming proposal edit:', error);
      onError?.(error instanceof Error ? error.message : 'Streaming failed');
    }
  }

  /**
   * Set up real-time events for proposal updates
   */
  setupProposalEvents(proposalId: number, callbacks: {
    onSectionUpdated?: (sectionId: string, content: string) => void;
    onProgressUpdated?: () => void;
  }): EventSource | null {
    try {
      const eventSource = new EventSource(`${this.baseUrl}/proposal-document/${proposalId}/events`);
      
      eventSource.addEventListener('section_updated', (event) => {
        const data = JSON.parse(event.data);
        callbacks.onSectionUpdated?.(data.section_id, data.content);
      });
      
      eventSource.addEventListener('progress_updated', () => {
        callbacks.onProgressUpdated?.();
      });
      
      eventSource.onerror = (error) => {
        console.error('Proposal events error:', error);
      };
      
      return eventSource;
    } catch (error) {
      console.error('Error setting up proposal events:', error);
      return null;
    }
  }
}

// Export singleton instance
export const proposalService = new ProposalService();