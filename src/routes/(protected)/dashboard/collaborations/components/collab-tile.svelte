<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    interface Props {
        id: string;
        title: string;
        description: string | null;
        collaboratorsCount?: number;
        isOwner?: boolean;
    }

    const { 
        id,
        title,
        description,
        collaboratorsCount = 1,
        isOwner = false,
    }: Props = $props();

    const dispatch = createEventDispatcher<{
        delete: { id: string };
        click: { id: string };
    }>();

    // Correct Svelte 5 runes syntax
    let showDeleteConfirm = $state(false);

    function handleDelete(event: MouseEvent) {
        // Prevent the click from bubbling up to the parent div
        event.stopPropagation();
        event.preventDefault();
        showDeleteConfirm = true;
    }

    function confirmDelete(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        dispatch('delete', { id });
        showDeleteConfirm = false;
    }

    function cancelDelete(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        showDeleteConfirm = false;
    }

    function handleClick() {
        // Only dispatch the click event if we're not showing the delete confirmation
        if (!showDeleteConfirm) {
            dispatch('click', { id });
        }
    }
</script>

<div 
    class="rounded-lg shadow bg-gradient-to-br from-[#3D3C40] to-[#2A292D] p-5 flex flex-col h-48 hover:shadow-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 cursor-pointer relative"
    on:click={handleClick}
>
    {#if isOwner && !showDeleteConfirm}
        <!-- Adding on:mousedown to ensure the button catches the event -->
        <button 
            type="button"
            on:click|stopPropagation={handleDelete}
            class="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400 z-20"
            aria-label="Delete collaboration"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
        </button>
    {/if}

    {#if showDeleteConfirm}
        <div class="absolute inset-0 bg-[#2A292D]/95 rounded-lg flex flex-col items-center justify-center p-4 z-10">
            <h4 class="text-white font-medium text-center mb-3">Delete this collaboration?</h4>
            <p class="text-gray-300 text-sm text-center mb-4">This action cannot be undone.</p>
            <div class="flex gap-3">
                <button 
                    type="button"
                    on:click|stopPropagation={cancelDelete}
                    class="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    on:click|stopPropagation={confirmDelete}
                    class="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    Delete
                </button>
            </div>
        </div>
    {/if}

    <div class="flex-grow">
        <h3 class="font-bold text-xl text-white mb-2 pr-7">{title}</h3>
        <p class="text-gray-300 text-sm line-clamp-3">{description || 'No description'}</p>
    </div>
    
    <div class="mt-4 pt-3 border-t border-gray-700 flex items-center">
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span class="ml-2 text-gray-300 text-sm">{collaboratorsCount} {collaboratorsCount === 1 ? 'Collaborator' : 'Collaborators'}</span>
        </div>
    </div>
</div>