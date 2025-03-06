<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";

	

    
</script>

<div class="w-full min-h-screen h-full flex items-center justify-center">
    
    <div class="w-[800px]">

        <div class="bg-[#3D3C40] rounded-xl min-h-12 px-4 py-3">
            <textarea 
                class="bg-transparent resize-none w-full break-words overflow-auto whitespace-pre-wrap outline-none" 
                placeholder="Ask a question" 
            ></textarea>

            <div class="w-full flex justify-end">
                <div class="size-8 bg-[#929292] rounded-full flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.625 10.5H18.375M18.375 10.5L10.5 2.625M18.375 10.5L10.5 18.375" stroke="#303030" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>                    
                </div>
            </div>
        </div>
    </div>
</div>