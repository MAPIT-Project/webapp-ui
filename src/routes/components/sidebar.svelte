<script lang="ts">

    let chat_titles = [
        "Search for common projects within x",
        "Example retrieval data for the project bla bla bla"
    ]

</script>


<div class="absolute w-[250px] h-screen bg-[#252527] p-6 shadow-md">
    <h1 class=" text-4xl font-bold tracking-[0.17em]">MAPIT</h1>

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
</div>