import type { Collaboration, Role } from '$lib/types/schema';
import { getCurrentClient } from './clientService';
import type { MessageWithUser } from '$lib/types/schema';

/**
 * Create a new collaboration and add the creator as an owner
 */
export async function createCollaboration(name: string, description: string | null): Promise<Collaboration | null> {
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
export async function getUserCollaborations(): Promise<Collaboration[]> {
    try {
        const response = await fetch('/api/collaborations', {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching collaborations:', result.error);
            return [];
        }

        return result.collaborations as Collaboration[];
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

export interface CollaborationMessage {
    id: number;
    conversationId: number;
    userId: number;
    text: string;
    sender: string;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

/**
 * Send a message in a collaboration conversation
 */
export async function sendCollaborationMessage(conversationId: number, text: string): Promise<CollaborationMessage | null> {
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
 * Get all messages for a collaboration conversation with user info
 */
export async function getCollaborationMessages(conversationId: number): Promise<CollaborationMessage[]> {
    try {
        const response = await fetch(`/api/chat/websocket?conversationId=${conversationId}`, {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching collaboration messages:', result.error);
            return [];
        }

        return result.messages as CollaborationMessage[];
    } catch (error) {
        console.error('Unexpected error fetching collaboration messages:', error);
        return [];
    }
}

/**
 * Get new messages since a timestamp (for polling)
 */
export async function getNewCollaborationMessages(conversationId: number, since: string): Promise<CollaborationMessage[]> {
    try {
        const response = await fetch(`/api/chat/websocket?conversationId=${conversationId}&since=${encodeURIComponent(since)}`, {
            method: 'GET'
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error fetching new collaboration messages:', result.error);
            return [];
        }

        return result.messages as CollaborationMessage[];
    } catch (error) {
        console.error('Unexpected error fetching new collaboration messages:', error);
        return [];
    }
}

/**
 * Create a simple polling mechanism for real-time updates
 */
export class CollaborationPolling {
    private intervalId: NodeJS.Timeout | null = null;
    private conversationId: number;
    private lastTimestamp: string | null = null;
    private onNewMessages: (messages: CollaborationMessage[]) => void;
    private pollingInterval: number;

    constructor(
        conversationId: number, 
        onNewMessages: (messages: CollaborationMessage[]) => void,
        pollingInterval = 2000 // 2 seconds
    ) {
        this.conversationId = conversationId;
        this.onNewMessages = onNewMessages;
        this.pollingInterval = pollingInterval;
    }

    start() {
        if (this.intervalId) return;

        this.intervalId = setInterval(async () => {
            if (this.lastTimestamp) {
                const newMessages = await getNewCollaborationMessages(this.conversationId, this.lastTimestamp);
                if (newMessages.length > 0) {
                    this.lastTimestamp = new Date().toISOString();
                    this.onNewMessages(newMessages);
                }
            } else {
                // First poll - just update timestamp
                this.lastTimestamp = new Date().toISOString();
            }
        }, this.pollingInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateTimestamp() {
        this.lastTimestamp = new Date().toISOString();
    }
}