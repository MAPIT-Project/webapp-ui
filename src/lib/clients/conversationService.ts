import type { conversation, message } from '$lib/server/db/schema';
import { getCurrentClient } from './clientService';
import { get } from 'svelte/store';
import { useDemo } from '$lib/stores/apiModeStore'; 
import { currentProvider } from '$lib/stores/aiProviderStore';

// Define interface for AI response
export interface AIResponseData {
  answer: string;
  ai_provider?: string;
  model_used?: string;
  demo?: boolean;
}

/**
 * Create a new conversation for the current user
 */
export async function createConversation(firstMessage: string, spaceId: string | null = null): Promise<conversation | null> {
    try {
        const nameFromMessage = firstMessage.length > 30 
            ? firstMessage.substring(0, 30) + '...' 
            : firstMessage;

        const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: 'General',
                name: nameFromMessage,
                firstMessage,
                spaceId: (spaceId && spaceId !== 'personal') ? spaceId : null
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error creating conversation:', result.error);
            return null;
        }

        return result.conversation as conversation;
    } catch (error) {
        console.error('Unexpected error creating conversation:', error);
        return null;
    }
}

/**
 * Add a user message to a conversation
 */
export async function addUserMessage(conversationId: number, text: string): Promise<message | null> {
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId,
                text,
                sender: 'user'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error adding user message:', result.error);
            return null;
        }

        return result.message as message;
    } catch (error) {
        console.error('Unexpected error adding user message:', error);
        return null;
    }
}

/**
 * Add an AI response message to a conversation
 */
export async function addAIMessage(conversationId: number, text: string): Promise<message | null> {
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId,
                text,
                sender: 'ai'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error adding AI message:', result.error);
            return null;
        }

        return result.message as message;
    } catch (error) {
        console.error('Unexpected error adding AI message:', error);
        return null;
    }
}

/**
 * Get an AI response from the API
 */
export async function getAIResponse(question: string): Promise<AIResponseData> {
    try {
        // Check if we should use the demo endpoint
        const isDemo = get(useDemo);
        const endpoint = isDemo ? '/api/demo' : '/api/query';
        
        // Get the current selected provider if not in demo mode
        const provider = get(currentProvider);
        
        // Prepare the request body
        const requestBody: any = { question };
        
        // Add AI provider if specified and not in demo mode
        if (provider && !isDemo) {
            requestBody.ai_provider = provider;
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle API error responses - format as error message
            let errorMessage = `Error: ${data.error || `API request failed with status ${response.status}`}`;
            if (data.details) {
                errorMessage += `\n\nDetails: ${data.details}`;
            }
            
            return {
                answer: errorMessage,
                ai_provider: data.ai_provider,
                model_used: data.model_used,
                demo: data.demo
            };
        }
        
        return {
            answer: data.answer,
            ai_provider: data.ai_provider,
            model_used: data.model_used,
            demo: data.demo
        };
    } catch (error) {
        console.error('Error fetching AI response:', error);
        
        // Return the actual error message with Error: prefix
        const errorMessage = `Error: ${error instanceof Error ? error.message : "I'm sorry, I wasn't able to generate a response. Please try again later."}`;
        
        return {
            answer: errorMessage
        };
    }
}

/**
 * Get all messages for a specific conversation
 */
export async function getConversationMessages(conversationId: number): Promise<message[]> {
    try {
        const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching messages:', result.error);
            return [];
        }

        return result.messages as message[];
    } catch (error) {
        console.error('Unexpected error fetching messages:', error);
        return [];
    }
}

/**
 * Get all conversations based on the spaceId (personal or collaboration)
 */
export async function getUserConversations(spaceId: string): Promise<conversation[]> {
    try {
        // For now, we'll get all conversations and filter client-side
        // You might want to add spaceId filtering to the API endpoint later
        const response = await fetch('/api/conversations', {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching conversations:', result.error);
            return [];
        }

        let conversations = result.conversations as conversation[];

        // Filter conversations based on spaceId
        if (spaceId === 'personal') {
            conversations = conversations.filter(conv => !conv.collaboration_id);
        } else {
            const collaborationIdNum = parseInt(spaceId);
            if (!isNaN(collaborationIdNum)) {
                conversations = conversations.filter(conv => conv.collaboration_id === collaborationIdNum);
            }
        }

        return conversations;
    } catch (error) {
        console.error('Unexpected error fetching conversations:', error);
        return [];
    }
}
