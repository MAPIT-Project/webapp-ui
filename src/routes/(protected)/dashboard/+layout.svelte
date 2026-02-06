<script lang="ts">
	import Sidebar from './components/sidebar.svelte';
	import { sidebarExpanded } from '$lib/stores/sidebarStore';
	import { user } from '$lib/stores/sessionStore';
	import { profileStore } from '$lib/stores/profileStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists, getClientByAuthId } from '$lib/clients/clientService';
	import Icon from '$lib/components/generic/icon.svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	let sidebarWidth: number = $state(250);

	function updateWidth(width: number) {
		sidebarWidth = width;
	}

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}

	let clientLoading = $state(true);
	let clientError: string | null = $state(null);

	// Load user profile data
	async function loadUserProfile(userId: string) {
		try {
			profileStore.setLoading(true);
			const client = await getClientByAuthId(userId);

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
			console.error('Error loading user profile:', err);
			profileStore.setError('Error loading user profile');
		} finally {
			profileStore.setLoading(false);
		}
	}

	async function initializeClient(currentUser: any) {
		try {
			const client = await ensureClientExists(currentUser.email?.split('@')[0]);
			if (!client) {
				console.error('Failed to create or find client record');
				clientError = 'Failed to initialize user data';
			} else {
				await loadUserProfile(currentUser.id);
			}
		} catch (err) {
			console.error('Error during client initialization:', err);
			clientError = 'Error setting up user account';
		} finally {
			clientLoading = false;
		}
	}

	// Use $effect with explicit store subscription
	$effect(() => {
		let initialized = false;
		const unsub = user.subscribe((currentUser) => {
			if (currentUser && !initialized) {
				initialized = true;
				initializeClient(currentUser);
			}
		});
		return unsub;
	});
</script>

<div id="teleport-container"></div>

<Sidebar onUpdateWidth={updateWidth} />
<div
	style="margin-left: {sidebarWidth}px"
	class="flex h-screen flex-col overflow-hidden transition-[margin] duration-150 ease-in-out"
>
	<!-- User menu -->
	{#if $page.url.pathname === '/dashboard'}
		<div class="absolute right-4 top-4 z-10">
			<button
				class="flex items-center gap-2 text-sm text-[#CACACA] hover:text-white"
				onclick={handleSignOut}
			>
				<span>{$user?.email}</span>
				<Icon name="logout" iconSize="sm" />
			</button>
		</div>
	{/if}

	<!-- Main content area that scrolls -->
	<div class="flex-1 overflow-y-auto">
		{@render children()}
	</div>
</div>
