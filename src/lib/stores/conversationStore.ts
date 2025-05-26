import { writable, get } from 'svelte/store';
import type { conversation } from '$lib/server/db/schema'; // MODIFIED
import { getUserConversations } from '$lib/clients/conversationService';
import { getSpace } from '$lib/stores/collaborationStore.svelte';

interface ConversationStore {
    conversations: conversation[]; // MODIFIED
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
            const currentSpaceId = getSpace();

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
                const conversations = await getUserConversations(currentSpaceId);
                set({
                    conversations,
                    isLoading: false,
                    error: conversations.length === 0 ? `No conversations found in ${currentSpaceId === 'personal' ? 'your personal space' : 'this collaboration'}.` : null,
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

                if (!forceReload) {
                    throw err;
                }
            }
        },
        addConversation: (newConversation: conversation) => { // MODIFIED
            update(state => ({
                ...state,
                conversations: [newConversation, ...state.conversations]
            }));
        },
        updateConversation: (id: number, updates: Partial<conversation>) => { // MODIFIED
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
