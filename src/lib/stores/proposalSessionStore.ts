import { writable, derived, get } from 'svelte/store';
import type { 
  ProposalSession, 
  SessionSection,
  SSEEvent,
  AgentThinkingEvent,
  ToolCallEvent,
  EvaluationResponse
} from '$lib/types/proposal-session';
import { proposalSessionService } from '$lib/clients/proposalSessionService';

// -- Types for Store State --

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sectionsAffected?: string[];
  thinking?: AgentThinkingEvent[]; // Accumulate thinking steps here
  toolCalls?: ToolCallEvent[];     // Accumulate tool calls here
}

interface ProposalSessionState {
  // Session Metadata
  sessionId: string | null;
  proposalId: number | null;
  callId: string | null;
  title: string | null;
  status: string | null;

  // Data
  sections: Record<string, SessionSection>;
  activeSectionId: string | null;
  completionPercentage: number;
  totalWords: number;

  // UI / Chat State
  messages: ChatMessage[];
  isStreaming: boolean;
  currentThought: string | null; // The *latest* thought to show in UI transiently
  currentToolCall: string | null; // The name of the tool currently running
  error: string | null;
  loading: boolean;
}

// -- Initial State --

const initialState: ProposalSessionState = {
  sessionId: null,
  proposalId: null,
  callId: null,
  title: null,
  status: null,
  sections: {},
  activeSectionId: null,
  completionPercentage: 0,
  totalWords: 0,
  messages: [],
  isStreaming: false,
  currentThought: null,
  currentToolCall: null,
  error: null,
  loading: false
};

function createProposalSessionStore() {
  const { subscribe, set, update } = writable<ProposalSessionState>(initialState);

  return {
    subscribe,
    reset: () => set(initialState),

    // -- Actions --

    async initSession(proposalId: number, callId: string, title: string, userId: string) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        // Try to create (or find existing, logic depends on backend)
        // For now we assume createSession handles "get or create" or we just create a new one
        const session = await proposalSessionService.createSession({
          proposal_id: proposalId,
          call_id: callId,
          title: title
        });

        set({
          ...initialState,
          sessionId: session.session_id,
          proposalId: session.proposal_id,
          callId: session.call_id,
          title: session.title,
          status: session.status,
          sections: session.sections,
          activeSectionId: session.active_section_id,
          completionPercentage: session.completion_percentage,
          totalWords: session.total_words,
          loading: false
        });
      } catch (err: any) {
        update(s => ({ ...s, loading: false, error: err.message || 'Failed to init session' }));
      }
    },

    async loadSession(sessionId: string) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const session = await proposalSessionService.getSession(sessionId);
        update(s => ({
          ...s,
          sessionId: session.session_id,
          proposalId: session.proposal_id,
          callId: session.call_id,
          title: session.title,
          status: session.status,
          sections: session.sections,
          activeSectionId: session.active_section_id,
          completionPercentage: session.completion_percentage,
          totalWords: session.total_words,
          loading: false
        }));
      } catch (err: any) {
        update(s => ({ ...s, loading: false, error: err.message }));
      }
    },

    setActiveSection(sectionId: string) {
      update(s => {
        // Optimistically update local state
        if (s.sessionId) {
          proposalSessionService.focusSection(s.sessionId, sectionId).catch(console.error);
        }
        return { ...s, activeSectionId: sectionId };
      });
    },

    async sendMessage(text: string) {
      // Get current state to access sessionId
      let currentState: ProposalSessionState | undefined;
      subscribe(s => { currentState = s; })();
      
      if (!currentState?.sessionId) return;

      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      // 1. Add User Message
      update(s => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: userMsgId,
            role: 'user',
            content: text,
            timestamp: new Date()
          }
        ],
        isStreaming: true,
        error: null,
        currentThought: null
      }));

      // 2. Prepare Assistant Message Placeholder
      // We don't add it yet to avoid an empty bubble, or we add it with empty content.
      // Let's wait for the first token or completion to add it, 
      // OR add it now and stream content into it. 
      // Strategy: Add it now so we can attach "thinking" steps to it.
      update(s => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            thinking: [],
            toolCalls: []
          }
        ]
      }));

      let currentResponseText = '';

      try {
        await proposalSessionService.sendMessageWithStreaming(
          currentState.sessionId,
          text,
          currentState.activeSectionId, // Context
          (event: SSEEvent) => {
            update(store => {
              // Find the assistant message to update
              const msgs = [...store.messages];
              const msgIndex = msgs.findIndex(m => m.id === assistantMsgId);
              if (msgIndex === -1) return store; // Should not happen

              const msg = { ...msgs[msgIndex] };

              switch (event.type) {
                case 'agent_thinking':
                  msg.thinking = [...(msg.thinking || []), event];
                  return { 
                    ...store, 
                    currentThought: event.thought, 
                    messages: msgs.map((m, i) => i === msgIndex ? msg : m) 
                  };

                case 'tool_call':
                  msg.toolCalls = [...(msg.toolCalls || []), event];
                  return { 
                    ...store, 
                    currentToolCall: event.tool_name,
                    messages: msgs.map((m, i) => i === msgIndex ? msg : m)
                  };

                case 'section_update':
                  // Update the actual section data
                  const updatedSections = { ...store.sections };
                  if (updatedSections[event.section_id]) {
                    updatedSections[event.section_id] = {
                      ...updatedSections[event.section_id],
                      content: event.content,
                      word_count: event.content.split(/\s+/).length, // Rough count
                      status: 'draft',
                      last_updated: new Date().toISOString()
                    };
                  }
                  return { ...store, sections: updatedSections };

                case 'token':
                  currentResponseText += event.content;
                  msg.content = currentResponseText;
                  return { 
                    ...store, 
                    messages: msgs.map((m, i) => i === msgIndex ? msg : m) 
                  };

                case 'agent_complete':
                  msg.sectionsAffected = event.result.sections_affected;
                  return { 
                    ...store, 
                    currentThought: null,
                    currentToolCall: null,
                    messages: msgs.map((m, i) => i === msgIndex ? msg : m) 
                  };

                case 'session_state':
                  return {
                    ...store,
                    completionPercentage: event.completion_percentage,
                    totalWords: event.total_words
                  };
                  
                case 'error':
                  return { ...store, error: event.error };

                default:
                  return store;
              }
            });
          },
          () => {
             update(s => ({ ...s, isStreaming: false, currentThought: null, currentToolCall: null }));
          },
          (err) => {
             update(s => ({ ...s, isStreaming: false, error: String(err) }));
          }
        );
      } catch (err) {
        update(s => ({ ...s, isStreaming: false, error: String(err) }));
      }
    },

    async updateSectionContent(sectionId: string, content: string) {
      let sessId: string | null = null;
      update(s => {
        sessId = s.sessionId;
        // Optimistic update
        const sections = { ...s.sections };
        if (sections[sectionId]) {
          sections[sectionId] = {
            ...sections[sectionId],
            content,
            is_dirty: true
          };
        }
        return { ...s, sections };
      });

      if (sessId) {
        try {
          await proposalSessionService.updateSection(sessId!, sectionId, content);
        } catch (e) {
          console.error('Failed to sync section update', e);
          // Revert logic could go here
        }
      }
    },

    async evaluateSection(sectionId: string) {
      let sessId: string | null = null;
      subscribe(s => { sessId = s.sessionId; })();
      if (!sessId) return;

      try {
        const result = await proposalSessionService.evaluateSection(sessId!, sectionId);
        update(s => {
          const sections = { ...s.sections };
          if (sections[sectionId]) {
            sections[sectionId] = {
              ...sections[sectionId],
              quality_score: result.score
            };
          }
          return { ...s, sections };
        });
        return result;
      } catch (e) {
        console.error(e);
      }
    }
  };
}

export const proposalSessionStore = createProposalSessionStore();

// Derived stores for ease of use
export const activeSection = derived(proposalSessionStore, $s => 
  $s.activeSectionId && $s.sections[$s.activeSectionId] ? $s.sections[$s.activeSectionId] : null
);

export const sessionMessages = derived(proposalSessionStore, $s => $s.messages);
export const isSessionStreaming = derived(proposalSessionStore, $s => $s.isStreaming);
export const sessionThought = derived(proposalSessionStore, $s => $s.currentThought);