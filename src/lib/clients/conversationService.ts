import { supabase } from './supabaseClient';
import type { conversation, message } from '$lib/server/db/schema'; // MODIFIED
import { getCurrentClient } from './clientService';
import { get } from 'svelte/store';
import { useDemo } from '$lib/stores/apiModeStore'; 

/**
 * Create a new conversation for the current user
 */
export async function createConversation(firstMessage: string, spaceId: string | null = null): Promise<conversation | null> { // MODIFIED
    try {
        // First, we need to get the current client to get their ID
        const client = await getCurrentClient();
        
        if (!client) {
            console.error('Cannot create conversation: No authenticated client found');
            return null;
        }
        
        const nameFromMessage = firstMessage.length > 30 
            ? firstMessage.substring(0, 30) + '...' 
            : firstMessage;

        const collaborationIdToInsert = (spaceId && spaceId !== 'personal') ? parseInt(spaceId) : null;
            
        const { data: newConversation, error: convError } = await supabase // Renamed to newConversation to avoid conflict
            .from('conversation')
            .insert([{ 
                user_id: client.id,
                name: nameFromMessage,
                topic: 'General',
                collaboration_id: collaborationIdToInsert
            }])
            .select()
            .single();
        
        if (convError) {
            console.error('Error creating conversation:', convError);
            return null;
        }
        
        return newConversation; // MODIFIED
    } catch (error) {
        console.error('Unexpected error creating conversation:', error);
        return null;
    }
}

/**
 * Add a user message to a conversation
 */
export async function addUserMessage(conversationId: number, text: string): Promise<message | null> { // MODIFIED
    try {
        const { data: message, error } = await supabase
            .from('message')
            .insert([{ 
                conversation_id: conversationId, 
                text,
                sender: 'user'
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error adding user message:', error);
            return null;
        }
        
        return message;
    } catch (error) {
        console.error('Unexpected error adding user message:', error);
        return null;
    }
}

/**
 * Add an AI response message to a conversation
 */
export async function addAIMessage(conversationId: number, text: string): Promise<message | null> { // MODIFIED
    try {
        const { data: message, error } = await supabase
            .from('message')
            .insert([{ 
                conversation_id: conversationId, 
                text,
                sender: 'ai'
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error adding AI message:', error);
            return null;
        }
        
        return message;
    } catch (error) {
        console.error('Unexpected error adding AI message:', error);
        return null;
    }
}

/**
 * Get an AI response from the API
 */
export async function getAIResponse(question: string): Promise<string> {
    try {
        // Check if we should use the demo endpoint
        const isDemo = get(useDemo);
        const endpoint = isDemo ? '/api/demo' : '/api/query';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error('Error fetching AI response:', error);
        return "I'm sorry, I wasn't able to generate a response. Please try again later.";
    }
}

/**
 * Get all messages for a specific conversation
 */
export async function getConversationMessages(conversationId: number): Promise<message[]> { // MODIFIED
    try {
        const { data, error } = await supabase
            .from('message')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching messages:', error);
        return [];
    }
}

/**
 * Get all conversations based on the spaceId (personal or collaboration)
 */
export async function getUserConversations(spaceId: string): Promise<conversation[]> { // MODIFIED
    try {
        const client = await getCurrentClient();
        if (!client) {
            console.error('Cannot fetch conversations: No authenticated client found');
            return [];
        }

        let query = supabase.from('conversation').select('*');

        if (spaceId === 'personal') {
            query = query.eq('user_id', client.id).is('collaboration_id', null);
        } else {
            const collaborationIdNum = parseInt(spaceId);
            if (isNaN(collaborationIdNum)) {
                console.error('Invalid collaboration ID for fetching conversations:', spaceId);
                return [];
            }
            query = query.eq('collaboration_id', collaborationIdNum);
            // Optionally, you might still want to ensure the user is part of this collaboration
            // This depends on your security model. For now, we fetch all conversations for that collaboration.
        }

        const { data, error } = await query.order('updated_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching conversations:', error);
        return [];
    }
}
