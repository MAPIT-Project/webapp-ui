<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";

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
</script>


<div style="width: {width}px;" class="absolute transition-all h-screen bg-[#252527]  {open ? 'p-3.5 flex flex-col items-center gap-12 pt-4' : 'p-6'} shadow-md">
    {#if !open}
    <div class="flex justify-between">
        <h1 class="text-4xl font-bold tracking-[0.17em]">MAPIT</h1>
        <button onclick={handleResize} class="p-0 pt-0.5 text-[#F5F5F5] h-6">
            <Icon 
                name="first_page"
            />
        </button>
    </div>

    <div class="mt-12 mb-16 p-2 flex items-center justify-center border-2 border-[#83858A] text-[#C2C2C2] rounded-full text-sm">
        <button>+ new chat</button>
    </div>


    <span class="font-semibold text-sm">Chats</span>
    <ul class="text-sm">
        {#each chat_titles as title}
            <li class="text-[#CACACA] whitespace-nowrap overflow-hidden text-ellipsis my-1 py-1 hover:bg-zinc-700 cursor-pointer">
                <button>
                    {title}
                </button>
            </li>
        {/each}
    </ul>
    {:else}
        <img src="/images/mapit_logo_no_bg.png" class="size-9 object-contain pt-2" alt="MAPIT Logo">
        
        <button onclick={handleResize} class="p-0 h-6 text-[#F5F5F5]">
            <Icon 
                name="last_page"
            />
        </button>

        <button class="p-0 h-6 text-[#F5F5F5]">
            <Icon 
                name="add_comment"
            />
        </button>
    {/if}


</div>