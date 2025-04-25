import { supabase } from './supabaseClient';
import type { Collaboration, Role } from '$lib/types/schema';
import { getCurrentClient } from './clientService';

/**
 * Create a new collaboration and add the creator as an owner
 */
export async function createCollaboration(name: string, description: string | null): Promise<Collaboration | null> {
    try {
        const client = await getCurrentClient();
        if (!client) {
            console.error('Cannot create collaboration: No authenticated client found');
            return null;
        }

        // Start a Supabase transaction
        const { data: collaboration, error: collabError } = await supabase
            .from('collaboration')
            .insert([{ 
                name,
                description
            }])
            .select()
            .single();

        if (collabError) {
            console.error('Error creating collaboration:', collabError);
            return null;
        }

        // Add the creator as an owner in client_collaboration
        const { error: joinError } = await supabase
            .from('client_collaboration')
            .insert([{
                collaboration_id: collaboration.id,
                client_id: client.id,
                role: 'owner'
            }]);

        if (joinError) {
            console.error('Error adding client to collaboration:', joinError);
            // TODO: Should probably delete the collaboration in this case
            return null;
        }

        return collaboration;
    } catch (error) {
        console.error('Unexpected error creating collaboration:', error);
        return null;
    }
}

/**
 * Get all collaborations for the current user
 */
export async function getUserCollaborations(): Promise<Collaboration[]> {
    try {
        const client = await getCurrentClient();
        
        if (!client) {
            console.error('Cannot fetch collaborations: No authenticated client found');
            return [];
        }
        
        // Updated query to include the number of collaborators for each collaboration
        const { data, error } = await supabase
            .from('collaboration')
            .select(`
                *,
                client_collaboration!inner(*),
                collaborators:client_collaboration(count)
            `)
            .eq('client_collaboration.client_id', client.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching collaborations:', error);
            return [];
        }
        
        // Transform the data to include collaborator count as a direct property
        const enhancedData = data?.map(collab => ({
            ...collab,
            collaboratorsCount: collab.collaborators ? collab.collaborators[0].count : 0
        })) || [];
        
        return enhancedData;
    } catch (error) {
        console.error('Unexpected error fetching collaborations:', error);
        return [];
    }
}

/**
 * Delete a collaboration if the current user is the owner
 */
export async function deleteCollaboration(collaborationId: string): Promise<boolean> {
    try {
        const client = await getCurrentClient();
        
        if (!client) {
            console.error('Cannot delete collaboration: No authenticated client found');
            return false;
        }
        
        // First, check if the user is the owner of the collaboration
        const { data: membership, error: membershipError } = await supabase
            .from('client_collaboration')
            .select('role')
            .eq('collaboration_id', collaborationId)
            .eq('client_id', client.id)
            .single();
            
        if (membershipError || !membership) {
            console.error('Error checking collaboration membership:', membershipError);
            return false;
        }
        
        // Only owners can delete collaborations
        if (membership.role !== 'owner') {
            console.error('Cannot delete collaboration: User is not the owner');
            return false;
        }
        
        // First delete all client_collaboration records for this collaboration
        const { error: deleteCollabMembersError } = await supabase
            .from('client_collaboration')
            .delete()
            .eq('collaboration_id', collaborationId);
            
        if (deleteCollabMembersError) {
            console.error('Error deleting collaboration memberships:', deleteCollabMembersError);
            return false;
        }
        
        // Now that references are removed, delete the collaboration
        const { error: deleteError } = await supabase
            .from('collaboration')
            .delete()
            .eq('id', collaborationId);
            
        if (deleteError) {
            console.error('Error deleting collaboration:', deleteError);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Unexpected error deleting collaboration:', error);
        return false;
    }
}