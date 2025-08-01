import { writable, get } from 'svelte/store';
import type { Conversation } from '$lib/types/schema'; // MODIFIED
import {
	getUserConversations,
	updateConversationName,
	deleteConversation
} from '$lib/clients/conversationService';
import { getSpace, registerSpaceChangeCallback } from '$lib/stores/collaborationStore.svelte';

interface ConversationStore {
	conversations: Conversation[]; // MODIFIED
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
					error:
						conversations.length === 0
							? `No conversations found in ${currentSpaceId === 'personal' ? 'your personal space' : 'this collaboration'}.`
							: null,
					loaded: true
				});
			} catch (err) {
				console.error('Error loading conversations:', err);
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
		addConversation: (newConversation: Conversation) => {
			// MODIFIED
			update((state) => ({
				...state,
				conversations: [newConversation, ...state.conversations]
			}));
		},
		updateConversation: (id: number, updates: Partial<Conversation>) => {
			// MODIFIED
			update((state) => ({
				...state,
				conversations: state.conversations.map((conv) =>
					conv.id === id ? { ...conv, ...updates } : conv
				)
			}));
		},
		deleteConversation: (id: number) => {
			update((state) => ({
				...state,
				conversations: state.conversations.filter((conv) => conv.id !== id)
			}));
		},
		deleteConversationById: async (id: number): Promise<boolean> => {
			try {
				const success = await deleteConversation(id);
				if (success) {
					update((state) => ({
						...state,
						conversations: state.conversations.filter((conv) => conv.id !== id)
					}));
					return true;
				}
				return false;
			} catch (error) {
				console.error('Error deleting conversation from store:', error);
				return false;
			}
		},
		updateConversationName: async (id: number, newName: string): Promise<boolean> => {
			try {
				const updatedConversation = await updateConversationName(id, newName);
				if (updatedConversation) {
					update((state) => ({
						...state,
						conversations: state.conversations.map((conv) =>
							conv.id === id ? { ...conv, name: newName } : conv
						)
					}));
					return true;
				}
				return false;
			} catch (error) {
				console.error('Error updating conversation name:', error);
				return false;
			}
		}
	};
}

export const conversationStore = createConversationStore();

// Register callback to reload conversations when space changes
registerSpaceChangeCallback(() => {
	conversationStore.loadConversations(true);
});
