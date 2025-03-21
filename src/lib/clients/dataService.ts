import { supabase } from './supabaseClient';
import type { Conversation, Message, NewConversation, NewMessage } from '$lib/server/db/schema';

/**
 * Get all conversations for the current user
 */
export async function getUserConversations() {
    const { data, error } = await supabase
        .from('conversation')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
    
    return data as Conversation[];
}

/**
 * Create a new conversation
 */
export async function createConversation(topic: string, name: string) {
    const { data, error } = await supabase
        .from('conversation')
        .insert([{ topic, name }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating conversation:', error);
        return null;
    }
    
    return data as Conversation;
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: number) {
    const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
    
    return data as Message[];
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId: number, text: string, sender: 'user' | 'ai' | 'system') {
    const { data, error } = await supabase
        .from('message')
        .insert([{ 
            conversation_id: conversationId, 
            text, 
            sender 
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding message:', error);
        return null;
    }
    
    return data as Message;
}
