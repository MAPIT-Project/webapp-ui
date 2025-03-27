import { writable, get } from 'svelte/store';
import type { Conversation } from '$lib/server/db/schema';
import { getUserConversations } from '$lib/clients/conversationService';

interface ConversationStore {
    conversations: Conversation[];
    isLoading: boolean;
    error: string | null;
    loaded: boolean;
}

function createConversationStore() {
    const store = writable<ConversationStore>({
        conversations: [],
        isLoading: false,
        error: null,
        loaded: false
    });

    const { subscribe, set, update } = store;

    return {
        subscribe,
        loadConversations: async (forceReload = false) => {
            // Don't reload if already loaded and not forcing
            if (!forceReload) {
                const currentState = get(store);
                if (currentState.loaded && !currentState.error) {
                    return;
                }
            }

            set({
                conversations: [],
                isLoading: true,
                error: null,
                loaded: false
            });

            try {
                // First check if we can get conversations
                const conversations = await getUserConversations();
                set({
                    conversations,
                    isLoading: false,
                    error: conversations.length === 0 ? "No conversations found" : null,
                    loaded: true
                });
            } catch (err) {
                console.error("Error loading conversations:", err);
                set({
                    conversations: [],
                    isLoading: false,
                    error: 'Please make sure you are logged in and try again.',
                    loaded: false
                });

                // If this is the initial load, throw the error so the component can handle it
                if (!forceReload) {
                    throw err;
                }
            }
        },
        addConversation: (conversation: Conversation) => {
            update(state => ({
                ...state,
                conversations: [conversation, ...state.conversations]
            }));
        },
        updateConversation: (id: number, updates: Partial<Conversation>) => {
            update(state => ({
                ...state,
                conversations: state.conversations.map(conv => 
                    conv.id === id ? { ...conv, ...updates } : conv
                )
            }));
        },
        deleteConversation: (id: number) => {
            update(state => ({
                ...state,
                conversations: state.conversations.filter(conv => conv.id !== id)
            }));
        }
    };
}

export const conversationStore = createConversationStore();
