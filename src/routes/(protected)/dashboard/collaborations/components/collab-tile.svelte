<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Icon from '$lib/components/generic/icon.svelte';

    interface Props {
        id: string;
        title: string;
        description: string | null;
        collaboratorsCount?: number;
        isOwner?: boolean;
        isActive?: boolean;
    }

    const { 
        id,
        title,
        description,
        collaboratorsCount = 1,
        isOwner = false,
        isActive = false,
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
    class="relative h-64 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group {isActive 
        ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' 
        : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 hover:border-gray-600/70'} 
    hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm"
    onclick={handleClick}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
    role="button"
    tabindex="0"
    aria-label="Open workspace: {title}"
>
    <!-- Active indicator -->
    {#if isActive}
        <div class="absolute top-3 left-3 flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 px-2 py-1 rounded-full backdrop-blur-sm">
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span class="text-purple-300 text-xs font-medium">Active</span>
        </div>
    {/if}

    <!-- Delete button -->
    {#if isOwner && !showDeleteConfirm}
        <button 
            type="button"
            onclick={handleDelete}
            class="absolute top-3 right-3 w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all flex items-center justify-center z-20 opacity-0 group-hover:opacity-100"
            aria-label="Delete workspace"
        >
            <Icon name="delete" iconClass="w-4 h-4" />
        </button>
    {/if}

    <!-- Delete confirmation overlay -->
    {#if showDeleteConfirm}
        <div class="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 z-30">
            <div class="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4">
                <Icon name="warning" iconClass="text-red-400 w-6 h-6" />
            </div>
            <h4 class="text-white font-semibold text-lg text-center mb-2">Delete Workspace?</h4>
            <p class="text-gray-400 text-sm text-center mb-6 max-w-xs">This action cannot be undone. All conversations and data will be permanently removed.</p>
            <div class="flex gap-3">
                <button 
                    type="button"
                    onclick={cancelDelete}
                    class="px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-all font-medium"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    onclick={confirmDelete}
                    class="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg"
                >
                    Delete
                </button>
            </div>
        </div>
    {/if}

    <!-- Main content -->
    <div class="p-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex-shrink-0 mb-4 {isActive ? 'pt-8' : 'pt-2'}">
            <h3 class="font-bold text-xl text-white mb-2 line-clamp-2 pr-8">{title}</h3>
            <p class="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                {description || 'No description provided'}
            </p>
        </div>
        
        <!-- Footer -->
        <div class="mt-auto pt-4 border-t border-gray-700/30">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                        <Icon name="people" iconClass="text-purple-400 w-4 h-4" />
                    </div>
                    <span class="text-gray-300 font-medium text-sm">
                        {collaboratorsCount} {collaboratorsCount === 1 ? 'member' : 'members'}
                    </span>
                </div>
                
                {#if isOwner}
                    <div class="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                        <Icon name="star" iconClass="text-amber-400 w-3 h-3" />
                        <span class="text-amber-400 text-xs font-medium">Owner</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Hover effect overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
</div>