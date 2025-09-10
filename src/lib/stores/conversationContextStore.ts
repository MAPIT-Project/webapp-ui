import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

export interface ProjectReference {
  project_id: string;
  acronym: string;
  title: string;
  position_in_results: number;
  framework_programme?: string;
  mentioned_at?: string;
}

export interface ConversationContext {
  conversationId: number;
  messages: Array<{
    text: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: string;
  }>;
  discussedProjects: ProjectReference[];
  followUpSuggestions: string[];
  isContextual: boolean;
  topicsOfInterest: string[];
  lastQueryType?: string;
}

function createConversationContextStore() {
  const { subscribe, set, update }: Writable<ConversationContext> = writable({
    conversationId: 0,
    messages: [],
    discussedProjects: [],
    followUpSuggestions: [],
    isContextual: true,
    topicsOfInterest: []
  });

  return {
    subscribe,
    setConversation: (id: number) => {
      // Reset context only when switching to a different conversation
      if (id !== 0) {
        set({
          conversationId: id,
          messages: [],
          discussedProjects: [],
          followUpSuggestions: [],
          isContextual: true,
          topicsOfInterest: []
        });
      } else {
        update(ctx => ({ ...ctx, conversationId: id }));
      }
    },
    addMessage: (message: any) => update(ctx => ({
      ...ctx,
      messages: [...ctx.messages, message]
    })),
    updateProjects: (projects: ProjectReference[]) => update(ctx => ({
      ...ctx,
      discussedProjects: projects
    })),
    updateSuggestions: (suggestions: string[]) => update(ctx => ({
      ...ctx,
      followUpSuggestions: suggestions
    })),
    updateTopics: (topics: string[]) => update(ctx => ({
      ...ctx,
      topicsOfInterest: topics
    })),
    updateQueryType: (queryType: string) => update(ctx => ({
      ...ctx,
      lastQueryType: queryType
    })),
    toggleContext: () => update(ctx => ({
      ...ctx,
      isContextual: !ctx.isContextual
    })),
    reset: () => set({
      conversationId: 0,
      messages: [],
      discussedProjects: [],
      followUpSuggestions: [],
      isContextual: true,
      topicsOfInterest: []
    })
  };
}

export const conversationContextStore = createConversationContextStore();

// Derived store for context summary
export const contextSummary: Readable<any> = derived(
  conversationContextStore,
  $store => ({
    hasContext: $store.messages.length > 0,
    projectCount: $store.discussedProjects.length,
    messageCount: $store.messages.length,
    lastProject: $store.discussedProjects[$store.discussedProjects.length - 1] || null,
    topics: $store.topicsOfInterest,
    isContextual: $store.isContextual
  })
);