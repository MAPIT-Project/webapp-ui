<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import Chatbox from "./components/chatbox.svelte";

	

    
</script>

<div class="w-full min-h-screen h-full flex items-center justify-center relative">
    <span class="text-[#CACACA] text-xs absolute left-4 top-4">AI Domain Expert Tool</span>
    <div class="w-[800px] flex flex-col items-center">
        <span class="text-2xl pb-8 font-semibold">What can I help you with?</span>
        <Chatbox />
    </div>
</div>