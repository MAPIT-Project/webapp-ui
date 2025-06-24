<script lang="ts">
import { onMount } from 'svelte';
import { scale, fade } from 'svelte/transition';
import { goto } from '$app/navigation';
import Modal from '$lib/components/generic/modal.svelte';
import Icon from '$lib/components/generic/icon.svelte';
import type { CollaborationWithDetails } from '$lib/types/schema';
import { createCollaboration, getUserCollaborations as fetchCollaborationsFromAPI, deleteCollaboration } from '$lib/clients/collaborationService';
import { addCollaborationToStore, removeCollaborationFromStore, fetchUserCollaborations, setSpace, getSpace } from '$lib/stores/collaborationStore.svelte';
import CollabTile from './components/collab-tile.svelte';

let collaborations: CollaborationWithDetails[] = $state([]);
let isModalOpen = $state(false);
let isLoading = $state(true);
let error: string | null = $state(null);
let newTitle = $state('');
let newDescription = $state('');
let isCreating = $state(false);

onMount(async () => {
    await loadCollaborations();
});

async function loadCollaborations() {
    try {
        isLoading = true;
        error = null;
        const apiCollaborations = await fetchCollaborationsFromAPI(); 
        // Use the data as returned from API (collaboratorsCount is now included)
        collaborations = apiCollaborations;
        console.log('Collaborations loaded for page:', collaborations);
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
    newTitle = '';
    newDescription = '';
}

async function addCollaboration() {
    if (!newTitle.trim()) return;

    try {
        isCreating = true;
        error = null;
        const newCollabData = await createCollaboration(newTitle.trim(), newDescription.trim() || null);
        
        if (newCollabData) {
            const enhancedCollaboration = {
                ...newCollabData,
                collaboratorsCount: 1, // New collaboration starts with 1 member (the creator)
                client_collaboration: [{ role: 'owner' }]
            };
            collaborations = [enhancedCollaboration, ...collaborations];
            
            addCollaborationToStore(newCollabData); 
            closeModal();
        } else {
            error = 'Failed to create collaboration. Please try again.';
        }
    } catch (err) {
        console.error('Error creating collaboration:', err);
        error = 'An error occurred while creating the collaboration.';
    } finally {
        isCreating = false;
    }
}

async function handleDeleteCollaboration(event: CustomEvent<{id: string}>) {
    const { id } = event.detail;
    
    try {
        isLoading = true;
        error = null;
        
        const success = await deleteCollaboration(id);
        
        if (success) {
            collaborations = collaborations.filter(collab => String(collab.id) !== id);
            removeCollaborationFromStore(id);
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
    console.log('Collaboration clicked:', id);
    
    // Switch to this collaboration workspace
    setSpace(id);
    
    // Navigate to the dashboard for this collaboration
    goto('/dashboard');
}

function clearError() {
    error = null;
}
</script>

<div class="min-h-screen bg-gradient-to-br from-[#2B2A2C] via-[#282729] to-[#252327] p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header Section -->
        <div class="mb-12" in:scale={{ duration: 300, start: 0.95 }}>
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Icon name="groups" iconClass="text-white text-xl" />
                </div>
                <div>
                    <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Team Workspaces
                    </h1>
                    <p class="text-gray-400 text-lg mt-1">Create and manage your collaborative projects</p>
                </div>
            </div>
            
            <!-- Stats and Quick Actions -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2 text-gray-400">
                        <Icon name="folder" iconClass="w-5 h-5" />
                        <span class="font-medium">{collaborations.length} workspace{collaborations.length !== 1 ? 's' : ''}</span>
                    </div>
                    {#if collaborations.length > 0}
                        <div class="flex items-center gap-2 text-gray-400">
                            <Icon name="people" iconClass="w-5 h-5" />
                            <span class="font-medium">{collaborations.reduce((sum, c) => sum + (c.collaboratorsCount || 1), 0)} total members</span>
                        </div>
                    {/if}
                </div>
                
                <button
                    onclick={openModal}
                    class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                >
                    <Icon name="add" iconClass="w-5 h-5" />
                    New Workspace
                </button>
            </div>
        </div>

        <!-- Error Message -->
        {#if error}
            <div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
                <div class="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/50 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                    <div class="flex items-start gap-3">
                        <Icon name="error" iconClass="text-red-400 w-5 h-5 mt-0.5" />
                        <div class="flex-1">
                            <p class="text-red-200 font-medium">{error}</p>
                        </div>
                        <button 
                            onclick={clearError}
                            class="text-red-400 hover:text-red-300 transition-colors"
                        >
                            <Icon name="close" iconClass="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {#if isLoading}
                <!-- Loading Skeletons -->
                {#each Array(6) as _, i}
                    <div class="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-2xl p-6 h-64 animate-pulse" 
                         in:scale={{ duration: 200, delay: i * 50, start: 0.95 }}>
                        <div class="space-y-4">
                            <div class="h-6 bg-gray-700/50 rounded-lg"></div>
                            <div class="space-y-2">
                                <div class="h-3 bg-gray-700/30 rounded"></div>
                                <div class="h-3 bg-gray-700/30 rounded w-3/4"></div>
                                <div class="h-3 bg-gray-700/30 rounded w-1/2"></div>
                            </div>
                            <div class="mt-auto pt-4 border-t border-gray-700/30">
                                <div class="h-4 bg-gray-700/30 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                <!-- Collaboration Tiles -->
                {#each collaborations as collab, i}
                    <div in:scale={{ duration: 300, delay: i * 50, start: 0.95 }}>
                        <CollabTile 
                            id={String(collab.id)}
                            title={collab.name} 
                            description={collab.description} 
                            collaboratorsCount={collab.collaboratorsCount}
                            isOwner={collab.client_collaboration?.some(cc => cc.role === 'owner') ?? false}
                            isActive={getSpace() === String(collab.id)}
                            on:delete={handleDeleteCollaboration}
                            on:click={handleCollabClick}
                        />
                    </div>
                {/each}
                
                <!-- Create New Workspace Tile -->
                <div in:scale={{ duration: 300, delay: collaborations.length * 50, start: 0.95 }}>
                    <button
                        onclick={openModal}
                        class="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-600/50 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all duration-300 group bg-gradient-to-br from-gray-800/20 to-gray-900/20 hover:from-purple-500/10 hover:to-purple-600/10"
                        aria-label="Create new workspace"
                    >
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Icon name="add" iconClass="text-purple-400 w-8 h-8" />
                        </div>
                        <span class="text-gray-400 font-medium group-hover:text-purple-400 transition-colors">Create Workspace</span>
                        <span class="text-gray-500 text-sm mt-1">Start collaborating with your team</span>
                    </button>
                </div>
            {/if}
        </div>

        <!-- Empty State -->
        {#if !isLoading && collaborations.length === 0}
            <div class="flex flex-col items-center justify-center py-16" in:fade={{ duration: 400 }}>
                <div class="w-24 h-24 rounded-3xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6">
                    <Icon name="groups" iconClass="text-purple-400 w-12 h-12" />
                </div>
                <h2 class="text-2xl font-semibold text-white mb-2">No workspaces yet</h2>
                <p class="text-gray-400 text-lg mb-8 text-center max-w-md">
                    Create your first workspace to start collaborating with your team on shared projects.
                </p>
                <button
                    onclick={openModal}
                    class="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                >
                    <Icon name="add" iconClass="w-5 h-5" />
                    Create Your First Workspace
                </button>
            </div>
        {/if}
    </div>
</div>

<!-- Enhanced Create Workspace Modal -->
<Modal
    bind:isOpen={isModalOpen}
    title="Create New Workspace"
    subtitle="Set up a collaborative space for your team"
    on:cancel={closeModal}
    closeOnEscape={true}
    background="bg-gradient-to-br from-gray-900 to-gray-800"
>
    <div slot="content" class="p-6 flex flex-col gap-6 w-full">
        <!-- Workspace Name -->
        <div class="flex flex-col gap-3">
            <label for="collab-title" class="text-sm font-semibold text-white flex items-center gap-2">
                <Icon name="edit" iconClass="text-purple-400 w-4 h-4" />
                Workspace Name
            </label>
            <div class="relative">
                <input
                    id="collab-title"
                    class="w-full border border-gray-600/50 rounded-xl px-4 py-3 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Enter a descriptive workspace name"
                    bind:value={newTitle}
                    maxlength={50}
                    disabled={isCreating}
                />
                {#if newTitle.length > 0}
                    <div class="absolute right-3 top-3 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                        {newTitle.length}/50
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Workspace Description -->
        <div class="flex flex-col gap-3">
            <label for="collab-desc" class="text-sm font-semibold text-white flex items-center gap-2">
                <Icon name="description" iconClass="text-purple-400 w-4 h-4" />
                Description
            </label>
            <div class="relative">
                <textarea
                    id="collab-desc"
                    class="w-full border border-gray-600/50 rounded-xl px-4 py-3 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                    placeholder="Describe what this workspace is for and what your team will work on"
                    bind:value={newDescription}
                    maxlength={200}
                    rows={4}
                    disabled={isCreating}
                ></textarea>
                {#if newDescription.length > 0}
                    <div class="absolute right-3 bottom-3 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                        {newDescription.length}/200
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Info Box -->
        <div class="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 p-4 rounded-xl">
            <div class="flex items-start gap-3">
                <Icon name="info" iconClass="text-purple-400 w-5 h-5 mt-0.5" />
                <div class="text-sm text-gray-300 leading-relaxed">
                    <p class="font-medium text-purple-300 mb-1">About Workspaces</p>
                    <p>Workspaces allow you to organize team projects with shared conversations, documents, and AI assistance. You can invite team members and collaborate in real-time.</p>
                </div>
            </div>
        </div>
    </div>
    
    <div slot="footer" class="flex justify-end gap-3 p-6 border-t border-gray-700/50">
        <button 
            onclick={closeModal}
            class="px-6 py-2.5 rounded-xl border border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:border-gray-500/50 transition-all font-medium"
            disabled={isCreating}
        >
            Cancel
        </button>
        <button 
            onclick={addCollaboration} 
            disabled={!newTitle.trim() || isCreating}
            class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
        >
            {#if isCreating}
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Creating...
            {:else}
                <Icon name="add" iconClass="w-4 h-4" />
                Create Workspace
            {/if}
        </button>
    </div>
</Modal>