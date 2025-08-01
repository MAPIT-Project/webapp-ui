import type { Collaboration, CollaborationWithDetails, Role } from '$lib/types/schema';
import { getCurrentClient } from './clientService';
import type { MessageWithUser } from '$lib/types/schema';
import { supabase } from './supabaseClient';
import type { Message } from '$lib/types/schema';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Create a new collaboration and add the creator as an owner
 */
export async function createCollaboration(
	name: string,
	description: string | null
): Promise<Collaboration | null> {
	try {
		const response = await fetch('/api/collaborations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name,
				description
			})
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error creating collaboration:', result.error);
			return null;
		}

		return result.collaboration as Collaboration;
	} catch (error) {
		console.error('Error in createCollaboration:', error);
		return null;
	}
}

/**
 * Get all collaborations for the current user
 */
export async function getUserCollaborations(): Promise<CollaborationWithDetails[]> {
	try {
		const response = await fetch('/api/collaborations', {
			method: 'GET'
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error fetching collaborations:', result.error);
			return [];
		}

		return result.collaborations as CollaborationWithDetails[];
	} catch (error) {
		console.error('Error in getUserCollaborations:', error);
		return [];
	}
}

/**
 * Delete a collaboration if the current user is the owner
 */
export async function deleteCollaboration(collaborationId: string): Promise<boolean> {
	try {
		const response = await fetch(`/api/collaborations?id=${collaborationId}`, {
			method: 'DELETE'
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error deleting collaboration:', result.error);
			return false;
		}

		return result.success;
	} catch (error) {
		console.error('Error in deleteCollaboration:', error);
		return false;
	}
}

export interface CollaborationMessage extends Message {
	user: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
	} | null;
}

export class CollaborationRealtimeService {
	private channels: Map<number, RealtimeChannel> = new Map();
	private messageCallbacks: Map<number, (message: CollaborationMessage) => void> = new Map();

	/**
	 * Subscribe to real-time messages for a collaboration conversation
	 */
	async subscribeToConversation(
		conversationId: number,
		onMessage: (message: CollaborationMessage) => void
	): Promise<void> {
		// Unsubscribe from any existing subscription for this conversation
		this.unsubscribeFromConversation(conversationId);

		const channelName = `collaboration-chat-${conversationId}`;

		const channel = supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'message',
					filter: `conversation_id=eq.${conversationId}`
				},
				async (payload) => {
					console.log('New message received:', payload);

					// The payload only contains the message data, we need to fetch user info
					const messageData = payload.new as any;

					try {
						// Fetch the user information for this message
						const { data: userInfo, error } = await supabase
							.from('client')
							.select('id, first_name, last_name, email')
							.eq('id', messageData.user_id)
							.single();

						const transformedMessage: CollaborationMessage = {
							id: messageData.id,
							conversationId: messageData.conversation_id,
							userId: messageData.user_id,
							text: messageData.text,
							sender: messageData.sender,
							createdAt: messageData.created_at,
							updatedAt: messageData.updated_at,
							user:
								userInfo && !error
									? {
											id: userInfo.id,
											firstName: userInfo.first_name,
											lastName: userInfo.last_name,
											email: userInfo.email
										}
									: null
						};

						onMessage(transformedMessage);
					} catch (error) {
						console.error('Error processing real-time message:', error);
					}
				}
			)
			.subscribe((status) => {
				console.log(
					`Collaboration chat subscription status: ${status} for conversation ${conversationId}`
				);
			});

		this.channels.set(conversationId, channel);
		this.messageCallbacks.set(conversationId, onMessage);
	}

	/**
	 * Unsubscribe from real-time messages for a conversation
	 */
	unsubscribeFromConversation(conversationId: number): void {
		const channel = this.channels.get(conversationId);
		if (channel) {
			supabase.removeChannel(channel);
			this.channels.delete(conversationId);
			this.messageCallbacks.delete(conversationId);
			console.log(`Unsubscribed from collaboration chat for conversation ${conversationId}`);
		}
	}

	/**
	 * Send a message to a collaboration conversation
	 */
	async sendMessage(conversationId: number, text: string): Promise<CollaborationMessage | null> {
		try {
			const response = await fetch('/api/chat/websocket', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					conversationId,
					text
				})
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Error sending collaboration message:', result.error);
				return null;
			}

			return result.message as CollaborationMessage;
		} catch (error) {
			console.error('Unexpected error sending collaboration message:', error);
			return null;
		}
	}

	/**
	 * Load initial messages for a collaboration conversation
	 */
	async loadConversationMessages(conversationId: number): Promise<CollaborationMessage[]> {
		try {
			const { data, error } = await supabase
				.from('message')
				.select(
					`
                    *,
                    user:client(id, first_name, last_name, email)
                `
				)
				.eq('conversation_id', conversationId)
				.order('created_at', { ascending: true });

			if (error) {
				console.error('Error loading collaboration messages:', error);
				return [];
			}

			return (data || []).map((message) => ({
				id: message.id,
				conversationId: message.conversation_id,
				userId: message.user_id,
				text: message.text,
				sender: message.sender,
				createdAt: message.created_at,
				updatedAt: message.updated_at,
				user: message.user
					? {
							id: message.user.id,
							firstName: message.user.first_name,
							lastName: message.user.last_name,
							email: message.user.email
						}
					: null
			}));
		} catch (error) {
			console.error('Unexpected error loading collaboration messages:', error);
			return [];
		}
	}

	/**
	 * Clean up all subscriptions
	 */
	cleanup(): void {
		for (const [conversationId] of this.channels) {
			this.unsubscribeFromConversation(conversationId);
		}
	}
}

// Export a singleton instance
export const collaborationRealtimeService = new CollaborationRealtimeService();
