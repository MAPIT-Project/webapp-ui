<script lang="ts">
	import Sidebar from "./components/sidebar.svelte";
	import { sidebarExpanded } from '$lib/stores/sidebarStore';
	import { onMount } from "svelte";
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from "$lib/clients/clientService";
	import Icon from "$lib/components/generic/icon.svelte";

	let { children } = $props();

	let sidebarWidth: number = $state(250);

	function updateWidth(width: number) {
		sidebarWidth = width;
	}

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}

	let clientLoading = true;
	let clientError = null;

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


<div id="teleport-container"></div>

<Sidebar onUpdateWidth={updateWidth} />
<div style="margin-left: {sidebarWidth}px" class="transition-[margin] duration-150 ease-in-out bg-[#2B2A2C]">
	<!-- User menu -->
    <div class="absolute right-4 top-4 z-10">
        <button class="text-[#CACACA] text-sm flex items-center gap-2 hover:text-white" onclick={handleSignOut}>
            <span>{$user?.email}</span>
            <Icon name="logout" iconSize="sm" />
        </button>
    </div>
	{@render children()}
</div>

