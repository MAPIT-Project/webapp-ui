import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { Citation } from '$lib/types/schema';
import { processRawCitationData } from '$lib/utils/citationConverter';

export interface StreamingMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  citations?: Citation[];
}

export interface ProcessingStage {
  stage: string;
  message: string;
  timestamp: string;
  routingDecision?: string;
  intentConfidence?: number;
  step?: number;
  totalSteps?: number;
  downloadUrl?: string;
  fileType?: 'docx' | 'xlsx' | 'zip';
  fileName?: string;
  packageContents?: string[];
}

export interface StreamingConversationState {
  conversationId: number;
  messages: StreamingMessage[];
  currentStage: ProcessingStage | null;
  isProcessing: boolean;
  followUpSuggestions: string[];
  discussedProjects: any[];
  contextUsed: boolean;
}

function createStreamingConversationStore() {
  const { subscribe, set, update }: Writable<StreamingConversationState> = writable({
    conversationId: 0,
    messages: [],
    currentStage: null,
    isProcessing: false,
    followUpSuggestions: [],
    discussedProjects: [],
    contextUsed: false
  });

  return {
    subscribe,
    
    setConversation: (id: number) => update(state => ({
      ...state,
      conversationId: id
    })),
    
    loadExistingMessages: async (conversationId: number) => {
      try {
        const response = await fetch(`/api/messages?conversationId=${conversationId}`);
        const result = await response.json();
        
        if (response.ok && result.messages) {
          const messages: StreamingMessage[] = result.messages.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.createdAt,
            isComplete: true,
            citations: msg.citations || []
          }));
          
          update(state => ({
            ...state,
            messages,
            discussedProjects: [], // Will be populated from context
            contextUsed: messages.length > 0
          }));
        }
      } catch (error) {
        console.error('Error loading existing messages:', error);
      }
    },
    
    addUserMessage: (text: string) => update(state => ({
      ...state,
      messages: [...state.messages, {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date().toISOString(),
        isComplete: true
      }]
    })),
    
    startAIResponse: () => {
      const messageId = Date.now().toString();
      update(state => ({
        ...state,
        isProcessing: true,
        messages: [...state.messages, {
          id: messageId,
          text: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          isComplete: false,
          citations: []
        }]
      }));
      return messageId;
    },
    
    updateStage: (stage: ProcessingStage) => update(state => ({
      ...state,
      currentStage: stage
    })),
    
    appendToAIMessage: (messageId: string, content: string) => update(state => ({
      ...state,
      messages: state.messages.map(msg => {
        if (msg.id !== messageId) return msg;
        const incoming = typeof content === 'string' ? content : '';
        const trimmedFirstChunk = msg.text.length === 0 ? incoming.replace(/^\s+/, '') : incoming;
        return { ...msg, text: msg.text + trimmedFirstChunk };
      })
    })),
    
    completeAIMessage: (messageId: string, metadata: any) => update(state => ({
      ...state,
      isProcessing: false,
      currentStage: null,
      followUpSuggestions: metadata.follow_up_suggestions || [],
      discussedProjects: metadata.projects_discussed || [],
      contextUsed: metadata.context_used || false,
      messages: state.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              isStreaming: false,
              isComplete: true,
              citations: processRawCitationData(metadata.citations || [])
            }
          : msg
      )
    })),
    
    setError: (error: string) => update(state => ({
      ...state,
      isProcessing: false,
      currentStage: null,
      messages: [...state.messages, {
        id: Date.now().toString(),
        text: `Error: ${error}`,
        sender: 'system',
        timestamp: new Date().toISOString(),
        isComplete: true,
        citations: []
      }]
    })),
    
    removeAIMessage: (messageId: string) => update(state => ({
      ...state,
      messages: state.messages.filter(msg => msg.sender !== 'ai' || msg.id !== messageId)
    })),
    
    reset: () => set({
      conversationId: 0,
      messages: [],
      currentStage: null,
      isProcessing: false,
      followUpSuggestions: [],
      discussedProjects: [],
      contextUsed: false
    })
  };
}

export const streamingConversationStore = createStreamingConversationStore();

// Derived stores
export const conversationSummary: Readable<any> = derived(
  streamingConversationStore,
  $store => ({
    messageCount: $store.messages.length,
    projectCount: $store.discussedProjects.length,
    hasContext: $store.contextUsed,
    isActive: $store.isProcessing,
    currentStage: $store.currentStage?.stage || null
  })
);