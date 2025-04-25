<script lang="ts">
import { onMount } from 'svelte';
import Modal from '$lib/components/generic/modal.svelte';
import type { Collaboration } from '$lib/types/schema';
import { createCollaboration, getUserCollaborations, deleteCollaboration } from '$lib/clients/collaborationService';
import CollabTile from './components/collab-tile.svelte';

let collaborations: Collaboration[] = [];
let isModalOpen = false;
let isLoading = true;
let error: string | null = null;
let newTitle = '';
let newDescription = '';

onMount(async () => {
    await loadCollaborations();
});

async function loadCollaborations() {
    try {
        isLoading = true;
        error = null;
        collaborations = await getUserCollaborations();
        console.log('Collaborations loaded:', collaborations);
    } catch (err) {
        console.error('Error loading collaborations:', err);
        error = 'Failed to load collaborations. Please try again.';
    } finally {
        isLoading = false;
    }
}

function openModal() {
    newTitle = '';
    newDescription = '';
    isModalOpen = true;
}

function closeModal() {
    isModalOpen = false;
}

async function addCollaboration() {
    if (!newTitle.trim()) return;

    try {
        error = null;
        const collaboration = await createCollaboration(newTitle.trim(), newDescription.trim() || null);
        
        if (collaboration) {
            // Add necessary properties to match the structure of collaborations from getUserCollaborations
            const enhancedCollaboration = {
                ...collaboration,
                collaboratorsCount: 1, // Start with 1 (just the creator)
                client_collaboration: [{ role: 'owner' }] // Add the client_collaboration with owner role
            };
            
            collaborations = [enhancedCollaboration, ...collaborations];
            closeModal();
        } else {
            error = 'Failed to create collaboration. Please try again.';
        }
    } catch (err) {
        console.error('Error creating collaboration:', err);
        error = 'An error occurred while creating the collaboration.';
    }
}

async function handleDeleteCollaboration(event: CustomEvent<{id: string}>) {
    const { id } = event.detail;
    
    try {
        isLoading = true;
        error = null;
        
        const success = await deleteCollaboration(id);
        
        if (success) {
            // Remove the deleted collaboration from the list
            collaborations = collaborations.filter(collab => collab.id !== id);
        } else {
            error = 'Failed to delete collaboration. You might not have permission.';
        }
    } catch (err) {
        console.error('Error deleting collaboration:', err);
        error = 'An error occurred while deleting the collaboration.';
    } finally {
        isLoading = false;
    }
}

function handleCollabClick(event: CustomEvent<{id: string}>) {
    const { id } = event.detail;
    // In the future, this could navigate to the collaboration details page
    console.log('Collaboration clicked:', id);
}
</script>

<div class="p-6">
    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span class="block sm:inline">{error}</span>
        </div>
    {/if}

    <h1 class="text-3xl font-semibold pt-2 pb-8">Collaborations</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {#if isLoading}
            <div class="col-span-full flex justify-center p-8">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        {:else}
            {#each collaborations as collab}
                <CollabTile 
                    id={collab.id}
                    title={collab.name} 
                    description={collab.description} 
                    collaboratorsCount={collab.collaboratorsCount}
                    isOwner={collab.client_collaboration?.some(cc => cc.role === 'owner') ?? false}
                    on:delete={handleDeleteCollaboration}
                    on:click={handleCollabClick}
                />
            {/each}
            <!-- Add new collaboration tile -->
            <div
                class="flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-50 min-h-[120px]"
                on:click={openModal}
                aria-label="Add new collaboration"
            >
                <span class="text-4xl text-gray-400">+</span>
            </div>
        {/if}
    </div>
</div>

<Modal
    bind:isOpen={isModalOpen}
    title="Create Collaboration"
    subtitle="Work together on a project"
    on:cancel={closeModal}
    closeOnEscape={true}
    background="bg-[#1E1E1E]"
>
    <div slot="content" class="p-4 flex flex-col gap-6 w-full max-w-md">
        <div class="flex flex-col gap-3">
            <label for="collab-title" class="text-sm font-medium text-gray-300">Title</label>
            <div class="relative">
                <input
                    id="collab-title"
                    class="w-full border border-[#444444] rounded-md px-4 py-2.5 bg-[#2A2A2A] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition-all duration-200"
                    placeholder="Enter a descriptive title"
                    bind:value={newTitle}
                    maxlength={50}
                />
                {#if newTitle.length > 0}
                    <div class="absolute right-3 bottom-2.5 text-xs text-gray-400">
                        {newTitle.length}/50
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="flex flex-col gap-3">
            <label for="collab-desc" class="text-sm font-medium text-gray-300">Description</label>
            <div class="relative">
                <textarea
                    id="collab-desc"
                    class="w-full border border-[#444444] rounded-md px-4 py-2.5 bg-[#2A2A2A] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent resize-none transition-all duration-200"
                    placeholder="Describe what this collaboration is about"
                    bind:value={newDescription}
                    maxlength={200}
                    rows={4}
                ></textarea>
                {#if newDescription.length > 0}
                    <div class="absolute right-3 bottom-2.5 text-xs text-gray-400">
                        {newDescription.length}/200
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="bg-[#343541]/30 p-4 rounded-md border border-[#444444] mt-2">
            <div class="flex items-start gap-3">
                <div class="shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <p class="text-sm text-gray-300">
                    Collaborations allow you to work with others on shared projects. All members will have access to the collaboration's resources.
                </p>
            </div>
        </div>
    </div>
    
    <div slot="footer" class="flex justify-end gap-3">
        <button 
            on:click={closeModal}
            class="px-4 py-2.5 rounded-md border border-[#444444] text-gray-300 hover:bg-[#2A2A2A] transition-colors duration-200 font-medium"
        >
            Cancel
        </button>
        <button 
            on:click={addCollaboration} 
            disabled={!newTitle.trim()}
            class="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Create Collaboration
        </button>
    </div>
</Modal>