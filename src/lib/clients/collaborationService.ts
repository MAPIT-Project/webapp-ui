import type { Collaboration, Role } from '$lib/types/schema';
import { getCurrentClient } from './clientService';

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