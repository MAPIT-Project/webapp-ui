<script lang="ts">
import Icon from "$lib/components/generic/icon.svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";

    interface Props {
        onUpdateWidth: (width: number) => void;
    }

    const {
        onUpdateWidth
    }: Props = $props();

    let chat_titles = [
        "Search for common projects within x",
        "Example retrieval data for the project bla bla bla"
    ]

    let width: number = $state(250);
    let open: boolean = $state(false);

    const handleResize = () => {
        open = !open;
        if (!open) {
            width = 250;
        } else {
            width = 65;
        }
        onUpdateWidth(width);
    }

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
    ]

    const handleNavigation = (url: string) => {
        return (e: MouseEvent) => {
            e.preventDefault();
            goto(`/dashboard${url}`);
        };
    };
</script>


<div style="width: {width}px;" class="absolute transition-all h-screen bg-[#252527]  {open ? 'p-3.5 flex flex-col items-center gap-12 pt-4' : 'p-6'} shadow-md">
    {#if !open}
        <div class="flex justify-between pb-12">
            <h1 class="text-4xl font-bold tracking-[0.17em]">MAPIT</h1>
            <button onclick={handleResize} class="p-0 pt-0.5 text-[#F5F5F5] h-6">
                <Icon 
                    name="first_page"
                />
            </button>
        </div>


        <div class="flex flex-col gap-2">
            {#each sideBarItems as item}
                <div class="w-full py-3 px-4 rounded-sm {$page.url.pathname.includes(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#28282A]'}">
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

        <!-- Show all sidebar items as icons in collapsed mode -->
        <div class="flex flex-col gap-4 w-full">
            {#each sideBarItems as item}
                <a href={item.url} onclick={handleNavigation(item.url)} 
                   class="p-2 py-6 h-6 text-[#F5F5F5] rounded-sm -mx-1 flex items-center justify-center w-[calc(100%+8px)] no-underline {$page.url.pathname.includes(item.url) ? 'bg-[#18181a]' : 'hover:bg-[#28282A]'}">
                    <Icon name={item.icon} />
                </a>
            {/each}
        </div>
    {/if}


</div>
