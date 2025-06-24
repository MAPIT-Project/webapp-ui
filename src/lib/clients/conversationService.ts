import type { Conversation, Message } from '$lib/types/schema';
import { getCurrentClient } from './clientService';
import { get } from 'svelte/store';
import { useDemo } from '$lib/stores/apiModeStore'; 
import { currentProvider, selectedVersion, useLocalDb, isVersionV5OrHigher } from '$lib/stores/aiProviderStore';

// Define interface for AI response
export interface AIResponseData {
  answer: string;
  ai_provider?: string;
  model_used?: string;
  ai_version?: string;
  data_source?: string;
  processing_time?: number;
  projects_found?: number;
  demo?: boolean;
}

/**
 * Create a new conversation for the current user
 */
export async function createConversation(firstMessage: string, spaceId: string | null = null): Promise<Conversation | null> {
    try {
        const nameFromMessage = firstMessage.length > 30 
            ? firstMessage.substring(0, 27) + '...' 
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

        return result.conversation as Conversation;
    } catch (error) {
        console.error('Unexpected error creating conversation:', error);
        return null;
    }
}

/**
 * Delete a conversation by ID
 * Only allows deletion if user has permission (personal conv creator or collaboration owner)
 */
export async function deleteConversation(conversationId: number): Promise<boolean> {
    try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error deleting conversation:', result.error);
            return false;
        }

        return result.success;
    } catch (error) {
        console.error('Unexpected error deleting conversation:', error);
        return false;
    }
}

/**
 * Add a user message to a conversation
 */
export async function addUserMessage(conversationId: number, text: string): Promise<Message | null> {
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

        return result.message as Message;
    } catch (error) {
        console.error('Unexpected error adding user message:', error);
        return null;
    }
}

/**
 * Add an AI response message to a conversation
 */
export async function addAIMessage(conversationId: number, text: string): Promise<Message | null> {
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

        return result.message as Message;
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
        
        // Get the current selected provider and version if not in demo mode
        const provider = get(currentProvider);
        const version = get(selectedVersion);
        
        // Prepare the request body
        const requestBody: any = { question };
        
        // Add AI provider if specified and not in demo mode
        if (provider && !isDemo) {
            requestBody.ai_provider = provider;
        }
        
        // Add AI version if specified and not in demo mode
        if (version && !isDemo) {
            requestBody.ai_version = version;

            // Add use_local_db if version is V5 or higher
            if (isVersionV5OrHigher(version)) {
                requestBody.use_local_db = get(useLocalDb);
            }
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
                ai_version: data.ai_version,
                data_source: data.data_source,
                processing_time: data.processing_time,
                projects_found: data.projects_found,
                demo: data.demo
            };
        }
        
        return {
            answer: data.answer,
            ai_provider: data.ai_provider,
            model_used: data.model_used,
            ai_version: data.ai_version,
            data_source: data.data_source,
            processing_time: data.processing_time,
            projects_found: data.projects_found,
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
export async function getConversationMessages(conversationId: number): Promise<Message[]> {
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
        console.error('Unexpected error fetching messages:', error);
        return [];
    }
}

/**
 * Update a conversation's name
 */
export async function updateConversationName(conversationId: number, newName: string): Promise<Conversation | null> {
    try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newName
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error updating conversation name:', result.error);
            return null;
        }

        return result.conversation as Conversation;
    } catch (error) {
        console.error('Unexpected error updating conversation name:', error);
        return null;
    }
}

/**
 * Get all conversations based on the spaceId (personal or collaboration)
 */
export async function getUserConversations(spaceId: string): Promise<Conversation[]> {
    try {
        // The backend will handle filtering based on the authenticated user and spaceId.
        const response = await fetch(`/api/conversations?spaceId=${encodeURIComponent(spaceId)}`, {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching conversations:', result.error);
            return [];
        }

        // The backend now returns only the conversations the user is authorized to see.
        return result.conversations as Conversation[];
    } catch (error) {
        console.error('Unexpected error fetching conversations:', error);
        return [];
    }
}
