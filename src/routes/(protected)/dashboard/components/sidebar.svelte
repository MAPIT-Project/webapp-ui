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
    
    onMount(async () => {
        const { data: { session: clientSession } } = await supabase.auth.getSession();
        if (!clientSession) {
            console.error('[Sidebar onMount] No active client-side session.');
        }
        // Fetch collaborations when the sidebar mounts
        await fetchUserCollaborations(); 
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

    function handleSpaceChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        setSpace(select.value);
    }

    function setSpaceById(spaceId: string) {
        setSpace(spaceId);
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

<div style="width: {width}px;" class="fixed top-0 left-0 transition-all h-screen bg-[#252527] {open ? 'p-3 flex flex-col items-center gap-10 pt-4' : 'p-5'} shadow-md z-20">
    {#if !open}
        <div class="flex flex-col gap-5">
            <div class="flex justify-between items-center">
                <h1 class="text-4xl font-bold tracking-[0.17em]">MAPIT</h1>
                <button onclick={handleResize} class="p-1 text-[#F5F5F5] h-8 w-8 flex items-center justify-center rounded hover:bg-[#3a3a3c]">
                    <Icon 
                        name="first_page"
                    />
                </button>
            </div>
            
            <!-- Space Selector (Expanded View) -->
            {#if isLoadingSpaces}
            <div class="space-selector relative">
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded-md py-2 px-3 focus:outline-none appearance-none pr-8"
                    disabled
                >
                    <option>Loading spaces...</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <Icon name="expand_more" />
                </div>
            </div>
            {:else if spaces.length > 0}
            <div class="space-selector relative">
                <!-- Ensure this reflects the store's current space -->
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                    value={currentSpace} 
                    onchange={handleSpaceChange}
                >
                    {#each spaces as space (space.id)}
                        <option value={space.id}>{space.name}</option>
                    {/each}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <Icon name="expand_more" />
                </div>
            </div>
            {:else}
            <div class="space-selector relative">
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded-md py-2 px-3 focus:outline-none appearance-none pr-8"
                    disabled
                >
                    <option>No spaces available</option>
                </select>
                 <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <Icon name="expand_more" />
                </div>
            </div>
            {/if}
        </div>

        <div class="flex flex-col gap-1.5 mt-6">
            {#each sideBarItems as item}
                <div class="w-full rounded-md {isActive(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#333335]'} transition-colors duration-150">
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
        
        <button onclick={handleResize} class="p-1 text-[#F5F5F5] h-8 w-8 flex items-center justify-center rounded hover:bg-[#3a3a3c]">
            <Icon 
                name="last_page"
            />
        </button>

        <div class="flex flex-col gap-3 w-full mt-3">
            {#each sideBarItems as item}
                <a href={item.url} onclick={handleNavigation(item.url)} 
                   title={item.name}
                   class="p-2 h-auto text-[#F5F5F5] rounded-md flex items-center justify-center w-full no-underline {isActive(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#333335]'} transition-colors duration-150">
                    <Icon name={item.icon} className="text-xl" />
                </a>
            {/each}
        </div>
    {/if}
</div>
