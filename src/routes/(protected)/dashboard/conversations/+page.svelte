<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import Chatbox from "../components/chatbox.svelte";
	import ChatSidebar from "../components/chat-sidebar.svelte";
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from "$lib/clients/clientService";
	import { onMount } from "svelte";

	
	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);
	
	
	// Create client record if one doesn't exist
	onMount(async () => {
	    if ($user) {
	        try {
	            const client = await ensureClientExists($user.email?.split('@')[0]);
	            if (!client) {
	                console.error("Failed to create or find client record");
	                clientError = "Failed to initialize user data";
	            }
	        } catch (err) {
	            console.error("Error during client initialization:", err);
	            clientError = "Error setting up user account";
	        } finally {
	            clientLoading = false;
	        }
	    }
	});
</script>

<div class="w-full min-h-screen h-full flex relative bg-gray-900">
    
    
    
    <!-- Chat sidebar -->
    <ChatSidebar />
    
    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center relative">
		<span class="text-[#CACACA] text-xs absolute left-4 top-4 z-10">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1">BETA</span> </span>
    
        {#if clientLoading}
            <div class="w-full p-4 flex justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        {:else if clientError}
            <div class="w-full max-w-[800px] p-4 bg-red-900/50 border border-red-700 rounded-lg mb-6">
                <p class="text-red-300">{clientError}</p>
                <div class="flex mt-4 space-x-4">
                    <button 
                        class="px-4 py-2 bg-red-700 text-white rounded-lg"
                        on:click={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        {:else}
            <div class="w-[800px] flex flex-col items-center">
                <span class="text-2xl pb-8 font-semibold text-[#CACACA]">What can I help you with?</span>
                <Chatbox />
            </div>
        {/if}
    </div>
</div>
