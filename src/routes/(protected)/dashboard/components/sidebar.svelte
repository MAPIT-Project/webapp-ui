<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { 
        getSpace, 
        setSpace, 
        getAllAvailableSpaces, // MODIFIED: Use the new getter function
        fetchUserCollaborations, 
        getIsLoadingUserCollaborations
    } from "$lib/stores/collaborationStore.svelte";
    import { onMount } from 'svelte';
    import { supabase } from '$lib/clients/supabaseClient';

    interface Props {
        onUpdateWidth: (width: number) => void;
    }

    const {
        onUpdateWidth
    }: Props = $props();

    let width: number = $state(250);
    let open: boolean = $state(false);

    // Space management
    let navigationEffectHasRunOnceAfterLoading = false; 
    
    // Custom dropdown state
    let showSpaceDropdown = $state(false);
    let dropdownElement: HTMLDivElement;
    
    onMount(() => {
        // Handle async initialization
        (async () => {
            const { data: { session: clientSession } } = await supabase.auth.getSession();
            if (!clientSession) {
                console.error('[Sidebar onMount] No active client-side session.');
            }
            // Fetch collaborations when the sidebar mounts
            await fetchUserCollaborations(); 
        })();
        
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
                showSpaceDropdown = false;
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    // Use derived state from the store via the new getter
    let spaces = $derived(getAllAvailableSpaces()); // MODIFIED
    let isLoadingSpaces = $derived(getIsLoadingUserCollaborations());
    let currentSpace = $derived(getSpace());

    // Effect to ensure currentSpace is valid after spaces are loaded/updated
    $effect(() => {
        if (isLoadingSpaces) return; 

        const spaceExists = spaces.find(s => s.id === currentSpace);
        if (!spaceExists && currentSpace !== 'personal') {
            if (spaces.length > 0 && !spaces.find(s => s.id === getSpace())) {
                 setSpace('personal');
            }
        } else if (!spaceExists && currentSpace === 'personal' && spaces.length > 0 && spaces[0].id !== 'personal') {
            // This case might be redundant if 'personal' is always first and present
            // but kept for safety if store logic changes how 'personal' is added.
            setSpace(spaces[0].id);
        }
    });

    // Effect to navigate to /dashboard when currentSpace changes
    $effect(() => {
        const _cs = currentSpace; // Ensure currentSpace is a dependency of this effect

        if (isLoadingSpaces) {
            navigationEffectHasRunOnceAfterLoading = false; 
            return;
        }

        if (!navigationEffectHasRunOnceAfterLoading) {
            navigationEffectHasRunOnceAfterLoading = true;
            return;
        }
        goto('/dashboard');
    });

    function handleSpaceChange(spaceId: string) {
        setSpace(spaceId);
        showSpaceDropdown = false;
    }

    function toggleDropdown() {
        showSpaceDropdown = !showSpaceDropdown;
    }

    function getCurrentSpaceName(): string {
        const space = spaces.find(s => s.id === currentSpace);
        return space?.name || 'Personal';
    }

    function isPersonalSpace(spaceId: string): boolean {
        return spaceId === 'personal';
    }

    const handleResize = () => {
        open = !open;
        if (!open) {
            width = 250;
        } else {
            width = 65;
        }
        onUpdateWidth(width);
    };

    handleResize();

    const sideBarItems = [
        {
            'name': 'Home',
            'icon': 'home',
            'url': '/'
        },
        {
            'name': 'Conversations',
            'icon': 'chat_bubble',
            'url': '/conversations'
        },
        {
            'name': 'Consortium',
            'icon': 'public',
            'url': '/consortium'
        },
        {
            'name': 'Collaborations',
            'icon': 'groups',
            'url': '/collaborations'
        }
    ];

    function isActive(url: string): boolean {
        if (url === '/') {
            return $page.url.pathname === '/dashboard';
        }
        return $page.url.pathname.includes(url);
    }

    const handleNavigation = (url: string) => {
        return (e: MouseEvent) => {
            e.preventDefault();
            goto(`/dashboard${url}`);
        };
    };
</script>

<div style="width: {width}px;" class="fixed top-0 left-0 transition-all h-screen {isPersonalSpace(currentSpace) ? 'bg-gradient-to-b from-[#1E1E22] via-[#1A1A20] to-[#181820]' : 'bg-gradient-to-b from-[#201E22] via-[#1C1A20] to-[#1A1820]'} {open ? 'p-3 flex flex-col items-center gap-10 pt-4' : 'p-5'} shadow-xl z-20">
    {#if !open}
        <div class="flex flex-col gap-5">
            <div class="flex justify-between items-center p-4 rounded-xl {isPersonalSpace(currentSpace) ? 'bg-gradient-to-r from-gray-800/30 to-gray-800/20 border border-gray-600/15' : 'bg-gradient-to-r from-gray-800/30 to-gray-800/20 border border-gray-600/15'} backdrop-blur-sm">
                <h1 class="text-4xl font-bold tracking-[0.17em] {isPersonalSpace(currentSpace) ? 'text-gray-100' : 'text-gray-100'}">MAPIT</h1>
                <button onclick={handleResize} class="p-1 text-[#F5F5F5] h-8 w-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
                    <Icon 
                        name="first_page"
                    />
                </button>
            </div>
            
            <!-- Enhanced Space Selector -->
            <div class="space-selector relative" bind:this={dropdownElement}>
                {#if isLoadingSpaces}
                    <!-- Loading State -->
                    <div class="w-full bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/50 rounded-xl p-3 cursor-not-allowed">
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-lg bg-gray-600/50 animate-pulse"></div>
                            <div class="flex-1">
                                <div class="h-3 bg-gray-600/50 rounded animate-pulse mb-1"></div>
                                <div class="h-2 bg-gray-700/50 rounded animate-pulse w-20"></div>
                            </div>
                            <div class="w-4 h-4 bg-gray-600/50 rounded animate-pulse"></div>
                        </div>
                    </div>
                {:else if spaces.length > 0}
                    <!-- Active Selector -->
                    <button 
                        class="w-full {isPersonalSpace(currentSpace) ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/50 border border-gray-600/30 hover:border-blue-500/20' : 'bg-gradient-to-r from-gray-800/50 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/50 border border-gray-600/30 hover:border-purple-500/20'} rounded-xl p-3 transition-all duration-200 text-left group backdrop-blur-sm"
                        onclick={toggleDropdown}
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <!-- Space Icon -->
                                <div class="w-6 h-6 rounded-lg flex items-center justify-center {isPersonalSpace(currentSpace) ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'} shadow-lg">
                                    <Icon name={isPersonalSpace(currentSpace) ? 'person' : 'groups'} iconClass="text-white text-sm" />
                                </div>
                                
                                <!-- Space Details -->
                                <div class="flex-1 min-w-0">
                                    <div class="text-white font-medium text-sm truncate">{getCurrentSpaceName()}</div>
                                    <div class="text-gray-400 text-xs font-medium">
                                        {isPersonalSpace(currentSpace) ? 'Personal workspace' : 'Team collaboration'}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Dropdown Arrow -->
                            <div class="text-gray-400 group-hover:text-gray-300 transition-all duration-200 {showSpaceDropdown ? 'rotate-180' : ''}">
                                <Icon name="expand_more" iconClass="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                    
                    <!-- Dropdown Menu -->
                    {#if showSpaceDropdown}
                        <div class="absolute top-full left-0 right-0 mt-2 {isPersonalSpace(currentSpace) ? 'bg-gradient-to-b from-gray-800/95 to-gray-900/95 border border-gray-600/40' : 'bg-gradient-to-b from-gray-800/95 to-gray-900/95 border border-gray-600/40'} rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                            <div class="p-2 space-y-1">
                                {#each spaces as space (space.id)}
                                    <button 
                                        class="w-full p-3 rounded-lg text-left hover:bg-gray-700/50 transition-all duration-200 group {currentSpace === space.id ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30' : 'border border-transparent'}"
                                        onclick={() => handleSpaceChange(space.id)}
                                    >
                                        <div class="flex items-center gap-3">
                                            <!-- Space Icon -->
                                            <div class="w-5 h-5 rounded-md flex items-center justify-center {isPersonalSpace(space.id) ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'} shadow-md">
                                                <Icon name={isPersonalSpace(space.id) ? 'person' : 'groups'} iconClass="text-white text-xs" />
                                            </div>
                                            
                                            <!-- Space Name -->
                                            <div class="flex-1 min-w-0">
                                                <div class="text-white font-medium text-sm truncate {currentSpace === space.id ? 'text-blue-100' : 'group-hover:text-blue-100'}">{space.name}</div>
                                                <div class="text-gray-400 text-xs">
                                                    {isPersonalSpace(space.id) ? 'Personal workspace' : 'Team collaboration'}
                                                </div>
                                            </div>
                                            
                                            <!-- Current Indicator -->
                                            {#if currentSpace === space.id}
                                                <div class="text-blue-400">
                                                    <Icon name="check" iconClass="w-4 h-4" />
                                                </div>
                                            {/if}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                            
                            <!-- Footer -->
                            <div class="border-t border-gray-700/50 p-3 bg-gray-800/50">
                                <a 
                                    href="/dashboard/collaborations"
                                    class="flex items-center gap-2 text-gray-400 hover:text-blue-400 text-xs font-medium transition-colors"
                                    onclick={() => showSpaceDropdown = false}
                                >
                                    <Icon name="add" iconClass="w-3 h-3" />
                                    Create or join workspace
                                </a>
                            </div>
                        </div>
                    {/if}
                {:else}
                    <!-- No Spaces Available -->
                    <div class="w-full bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/50 rounded-xl p-3">
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-lg bg-gray-600/50 flex items-center justify-center">
                                <Icon name="warning" iconClass="text-gray-400 text-sm" />
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-300 font-medium text-sm">No workspaces</div>
                                <div class="text-gray-500 text-xs">Create one to get started</div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex flex-col gap-1.5 mt-6">
            {#each sideBarItems as item}
                <div class="w-full rounded-xl {isActive(item.url) 
                    ? (isPersonalSpace(currentSpace) ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/40 border border-blue-500/15' : 'bg-gradient-to-r from-gray-800/50 to-gray-700/40 border border-purple-500/15')
                    : (isPersonalSpace(currentSpace) ? 'hover:bg-gray-800/30 border border-transparent hover:border-blue-500/10' : 'hover:bg-gray-800/30 border border-transparent hover:border-purple-500/10')
                } transition-all duration-200 backdrop-blur-sm">
                    <a href={item.url} onclick={handleNavigation(item.url)} class="py-2.5 px-3.5 h-auto text-[#F5F5F5] flex gap-3.5 items-center no-underline">
                        <Icon 
                            name={item.icon} className="text-xl"
                        />
                        <span>{item.name}</span>
                    </a>
                </div>
            {/each}
        </div>
        
    {:else}
        <img src="/images/mapit_logo_no_bg.png" class="size-8 object-contain" alt="MAPIT Logo">
        
        <button onclick={handleResize} class="p-1 text-[#F5F5F5] h-8 w-8 flex items-center justify-center rounded-lg {isPersonalSpace(currentSpace) ? 'hover:bg-gray-700/40 border border-blue-500/10' : 'hover:bg-gray-700/40 border border-purple-500/10'} transition-all backdrop-blur-sm">
            <Icon 
                name="last_page"
            />
        </button>

        <div class="flex flex-col gap-3 w-full mt-3">
            {#each sideBarItems as item}
                <a href={item.url} onclick={handleNavigation(item.url)} 
                   title={item.name}
                   class="p-2 h-auto text-[#F5F5F5] rounded-xl flex items-center justify-center w-full no-underline {isActive(item.url) 
                    ? (isPersonalSpace(currentSpace) ? 'bg-gray-800/50 border border-blue-500/15' : 'bg-gray-800/50 border border-purple-500/15')
                    : (isPersonalSpace(currentSpace) ? 'hover:bg-gray-700/30 border border-transparent hover:border-blue-500/10' : 'hover:bg-gray-700/30 border border-transparent hover:border-purple-500/10')
                } transition-all duration-200 backdrop-blur-sm">
                    <Icon name={item.icon} className="text-xl" />
                </a>
            {/each}
        </div>
    {/if}
</div>
