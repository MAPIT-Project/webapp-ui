import type { Conversation, Message, NewConversation, NewMessage } from '$lib/server/db/schema';

/**
 * Get all conversations for the current user
 */
export async function getUserConversations() {
	try {
		const response = await fetch('/api/conversations', {
			method: 'GET'
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error fetching conversations:', result.error);
			return [];
		}

		return result.conversations as Conversation[];
	} catch (error) {
		console.error('Error in getUserConversations:', error);
		return [];
	}
}

/**
 * Create a new conversation
 */
export async function createConversation(topic: string, name: string) {
	try {
		const response = await fetch('/api/conversations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				topic,
				name
			})
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error creating conversation:', result.error);
			return null;
		}

		return result.conversation as Conversation;
	} catch (error) {
		console.error('Error in createConversation:', error);
		return null;
	}
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: number) {
	try {
		const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
			method: 'GET'
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error fetching messages:', result.error);
			return [];
		}

		return result.messages as Message[];
	} catch (error) {
		console.error('Error in getConversationMessages:', error);
		return [];
	}
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
	conversationId: number,
	text: string,
	sender: 'user' | 'ai' | 'system'
) {
	try {
		const response = await fetch('/api/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				conversationId,
				text,
				sender
			})
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error adding message:', result.error);
			return null;
		}

		return result.message as Message;
	} catch (error) {
		console.error('Error in addMessage:', error);
		return null;
	}
}
