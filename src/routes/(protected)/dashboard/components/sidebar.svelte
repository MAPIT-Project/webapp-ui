<script lang="ts">
import Icon from "$lib/components/generic/icon.svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { getSpace, setSpace } from "$lib/stores/collaborationStore.svelte";
import { onMount } from 'svelte';
import { supabase } from '$lib/clients/supabaseClient'; // Import client-side Supabase

    interface Props {
        onUpdateWidth: (width: number) => void;
    }

    const {
        onUpdateWidth
    }: Props = $props();

    let width: number = $state(250);
    let open: boolean = $state(false);

    // Space management
    let userCollaborations = $state<{ id: string; name: string }[]>([]);
    let isLoadingSpaces = $state(true);
    let navigationEffectHasRunOnceAfterLoading = false; // Flag for navigation effect
    
    onMount(async () => {
        // Client-side session check
        const { data: { session: clientSession } } = await supabase.auth.getSession();
        console.log('[Sidebar onMount] Client-side session:', clientSession);
        if (!clientSession) {
            console.error('[Sidebar onMount] No active client-side session. User might be logged out or session expired.');
            // Optionally, you could trigger a redirect to login here if appropriate for your app flow
            // For now, we'll let the API call proceed and potentially fail with 401,
            // which might be handled by a global error handler or page-level logic.
        }

        isLoadingSpaces = true;
        try {
            const response = await fetch('/api/user-collaborations', {
                credentials: 'include' // Ensure cookies are sent
            });
            if (response.ok) {
                const fetchedCollaborations = await response.json();
                userCollaborations = fetchedCollaborations.map((c: { id: number | string; name: string }) => ({
                    ...c,
                    id: String(c.id) // Ensure ID is a string
                }));
            } else {
                console.error('Failed to fetch collaborations:', response.statusText);
                userCollaborations = []; // Default to empty on error
            }
        } catch (error) {
            console.error('Error fetching collaborations:', error);
            userCollaborations = []; // Default to empty on error
        } finally {
            isLoadingSpaces = false;
        }
    });

    let spaces = $derived([
        { id: 'personal', name: 'Personal' },
        ...userCollaborations
    ]);

    let currentSpace = $derived(getSpace());

    // Effect to ensure currentSpace is valid after spaces are loaded/updated
    $effect(() => {
        if (isLoadingSpaces) return; // Don't run effect while spaces are loading

        const spaceExists = spaces.find(s => s.id === currentSpace);
        if (!spaceExists && currentSpace !== 'personal') {
            if (spaces.length > 0 && !spaces.find(s => s.id === getSpace())) {
                 setSpace('personal');
            }
        } else if (!spaceExists && currentSpace === 'personal' && spaces.length > 0 && spaces[0].id !== 'personal') {
            setSpace(spaces[0].id);
        }
    });

    // Effect to navigate to /dashboard when currentSpace changes
    $effect(() => {
        if (isLoadingSpaces) {
            navigationEffectHasRunOnceAfterLoading = false; // Reset flag if loading starts again
            return;
        }

        if (!navigationEffectHasRunOnceAfterLoading) {
            navigationEffectHasRunOnceAfterLoading = true;
            // This is the first run after spaces are loaded and currentSpace is initialized.
            // Do not navigate yet.
            return;
        }

        // If we reach here, it means:
        // 1. Not loading spaces.
        // 2. This is not the first run of the effect after loading completed.
        // 3. Therefore, currentSpace must have changed.
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

<div style="width: {width}px;" class="absolute transition-all h-screen bg-[#252527]  {open ? 'p-3.5 flex flex-col items-center gap-12 pt-4' : 'p-6'} shadow-md">
    {#if !open}
        <div class="flex flex-col gap-4">
            <div class="flex justify-between">
                <h1 class="text-4xl font-bold tracking-[0.17em]">MAPIT</h1>
                <button onclick={handleResize} class="p-0 pt-0.5 text-[#F5F5F5] h-6">
                    <Icon 
                        name="first_page"
                    />
                </button>
            </div>
            
            <!-- Space Selector (Expanded View) -->
            {#if isLoadingSpaces}
            <div class="space-selector">
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded py-2 px-3 focus:outline-none"
                    disabled
                >
                    <option>Loading spaces...</option>
                </select>
            </div>
            {:else if spaces.length > 0}
            <div class="space-selector">
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentSpace}
                    onchange={handleSpaceChange}
                >
                    {#each spaces as space (space.id)}
                        <option value={space.id}>{space.name}</option>
                    {/each}
                </select>
            </div>
            {:else}
            <div class="space-selector">
                <select 
                    class="w-full bg-[#18181a] text-white border border-[#444654]/50 rounded py-2 px-3 focus:outline-none"
                    disabled
                >
                    <option>No spaces available</option>
                </select>
            </div>
            {/if}
        </div>

        <div class="flex flex-col gap-2 mt-8">
            {#each sideBarItems as item}
                <div class="w-full py-3 px-4 rounded-sm {isActive(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#28282A]'}">
                    <a href={item.url} onclick={handleNavigation(item.url)} class="p-0 h-6 text-[#F5F5F5] flex gap-4 items-center no-underline">
                        <Icon 
                            name={item.icon}
                        />
                        <span>{item.name}</span>
                    </a>
                </div>
            {/each}
        </div>
        
    {:else}
        <img src="/images/mapit_logo_no_bg.png" class="size-9 object-contain pt-2" alt="MAPIT Logo">
        
        <button onclick={handleResize} class="p-0 h-6 text-[#F5F5F5]">
            <Icon 
                name="last_page"
            />
        </button>

        <div class="flex flex-col gap-4 w-full mt-4">
            {#each sideBarItems as item}
                <a href={item.url} onclick={handleNavigation(item.url)} 
                   class="p-2 py-6 h-6 text-[#F5F5F5] rounded-sm -mx-1 flex items-center justify-center w-[calc(100%+8px)] no-underline {isActive(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#28282A]'}">
                    <Icon name={item.icon} />
                </a>
            {/each}
        </div>
    {/if}
</div>
