<script lang="ts">
	import Sidebar from "./components/sidebar.svelte";
	import { sidebarExpanded } from '$lib/stores/sidebarStore';
	import { onMount } from "svelte";
	import { user } from '$lib/stores/sessionStore';
	import { profileStore } from '$lib/stores/profileStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists, getClientByAuthId } from "$lib/clients/clientService";
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

	// Load user profile data
	async function loadUserProfile() {
		if (!$user?.id) return;
		
		try {
			profileStore.setLoading(true);
			const client = await getClientByAuthId($user.id);
			
			if (client) {
				profileStore.setProfile({
					id: client.id,
					firstName: client.first_name,
					lastName: client.last_name,
					email: client.email,
					loading: false,
					error: null
				});
			} else {
				profileStore.setError('Failed to load user profile');
			}
		} catch (err) {
			console.error("Error loading user profile:", err);
			profileStore.setError('Error loading user profile');
		} finally {
			profileStore.setLoading(false);
		}
	}

	// Create client record if one doesn't exist
	onMount(async () => {
	    if ($user) {
	        try {
	            const client = await ensureClientExists($user.email?.split('@')[0]);
	            if (!client) {
	                console.error("Failed to create or find client record");
	                clientError = "Failed to initialize user data";
	            } else {
	                // Load user profile information
	                await loadUserProfile();
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
<div style="margin-left: {sidebarWidth}px" class="h-screen overflow-hidden flex flex-col transition-[margin] duration-150 ease-in-out bg-[#2B2A2C]">
	<!-- User menu -->
    <div class="absolute right-4 top-4 z-10">
        <button class="text-[#CACACA] text-sm flex items-center gap-2 hover:text-white" onclick={handleSignOut}>
            <span>{$user?.email}</span>
            <Icon name="logout" iconSize="sm" />
        </button>
    </div>
	
	<!-- Main content area that scrolls -->
	<div class="flex-1 overflow-y-auto">
		{@render children()}
	</div>
</div>

