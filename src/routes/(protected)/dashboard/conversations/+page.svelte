<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import Chatbox from "../components/chatbox.svelte";
	import ChatSidebar from "../components/chat-sidebar.svelte";
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from "$lib/clients/clientService";
	import { onMount } from "svelte";
	import ApiModeToggle from "../components/api-mode-toggle.svelte";

	
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

<div class="w-full min-h-screen h-full flex relative bg-[#2B2A2C]">
    
    <!-- Chat sidebar -->
    <ChatSidebar />
    
    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center relative">
        <div class="absolute left-4 top-4 z-10 flex items-center">
            <span class="text-[#A0A0A8] text-xs">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1 bg-gray-700 text-gray-300 px-1 py-0.5 rounded">BETA</span></span>
        </div>
        
        <!-- API Mode Toggle -->
        <div class="absolute right-4 top-4 z-10">
            <ApiModeToggle />
        </div>
    
        {#if clientLoading}
            <div class="w-full p-4 flex justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#A0A0A8]"></div>
            </div>
        {:else if clientError}
            <div class="w-full max-w-[800px] p-6 bg-red-900/30 border border-red-700/50 rounded-lg mb-6 shadow-lg">
                <div class="flex items-start">
                    <div class="mr-4 p-2 bg-red-900/50 rounded-lg">
                        <Icon name="error" class="text-red-400" />
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-red-300 mb-2">Error</h3>
                        <p class="text-red-300 mb-4">{clientError}</p>
                        <button 
                            class="px-4 py-2 bg-red-700/50 hover:bg-red-700/80 text-white rounded-lg transition-colors"
                            onclick={() => window.location.reload()}
                        >
                            <div class="flex items-center">
                                <Icon name="refresh" class="mr-2" />
                                Retry
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <div class="w-[800px] flex flex-col items-center pt-10">
                <span class="text-3xl pb-8 font-semibold text-white">How can I help you today?</span>
                <Chatbox />
            </div>
        {/if}
    </div>
</div>
