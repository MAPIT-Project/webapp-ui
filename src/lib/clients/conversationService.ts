import { supabase } from './supabaseClient';
import type { Conversation, Message } from '$lib/server/db/schema';
import { getCurrentClient } from './clientService';

/**
 * Create a new conversation for the current user
 */
export async function createConversation(firstMessage: string): Promise<Conversation | null> {
    try {
        // First, we need to get the current client to get their ID
        const client = await getCurrentClient();
        
        if (!client) {
            console.error('Cannot create conversation: No authenticated client found');
            return null;
        }
        
        // Create a conversation with a default name based on the first message
        // We'll truncate the message to use as the conversation name
        const nameFromMessage = firstMessage.length > 30 
            ? firstMessage.substring(0, 30) + '...' 
            : firstMessage;
            
        const { data: conversation, error: convError } = await supabase
            .from('conversation')
            .insert([{ 
                user_id: client.id,
                name: nameFromMessage,
                topic: 'General'
            }])
            .select()
            .single();
        
        if (convError) {
            console.error('Error creating conversation:', convError);
            return null;
        }
        
        return conversation;
    } catch (error) {
        console.error('Unexpected error creating conversation:', error);
        return null;
    }
}

/**
 * Add a user message to a conversation
 */
export async function addUserMessage(conversationId: number, text: string): Promise<Message | null> {
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
export async function addAIMessage(conversationId: number, text: string): Promise<Message | null> {
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
 * Get an AI response from the FastAPI demo endpoint
 */
export async function getAIResponse(question: string): Promise<string> {
    try {
        const response = await fetch('http://localhost:8000/api/demo', {
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
export async function getConversationMessages(conversationId: number): Promise<Message[]> {
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
 * Get all conversations for the current user
 */
export async function getUserConversations(): Promise<Conversation[]> {
    try {
        const client = await getCurrentClient();
        
        if (!client) {
            console.error('Cannot fetch conversations: No authenticated client found');
            return [];
        }
        
        const { data, error } = await supabase
            .from('conversation')
            .select('*')
            .eq('user_id', client.id)
            .order('created_at', { ascending: false });
        
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
