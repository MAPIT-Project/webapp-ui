<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import Chatbox from "./components/chatbox.svelte";
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}
</script>

<div class="w-full min-h-screen h-full flex items-center justify-center relative">
    <span class="text-[#CACACA] text-xs absolute left-4 top-4">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1">BETA</span> </span>
    
    <!-- User menu -->
    <div class="absolute right-4 top-4">
        <button class="text-[#CACACA] text-sm flex items-center gap-2 hover:text-white" on:click={handleSignOut}>
            <span>{$user?.email}</span>
            <Icon name="logout" iconSize="sm" />
        </button>
    </div>
    
    <div class="w-[800px] flex flex-col items-center">
        <span class="text-2xl pb-8 font-semibold text-[#CACACA]">What can I help you with?</span>
        <Chatbox />
    </div>
</div>
