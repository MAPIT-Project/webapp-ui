<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { profileStore } from '$lib/stores/profileStore';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { proposalService } from '$lib/clients/proposalService';
	import {
		getUserCollaborationItemsOnly,
		fetchUserCollaborations
	} from '$lib/stores/collaborationStore.svelte';
	import type { Proposal } from '$lib/types/proposal';
	import Icon from '$lib/components/generic/icon.svelte';
	import { goto } from '$app/navigation';

	// --- State ---
	let isLoaded = $state(false);
	let conversations = $state<any[]>([]);
	let proposals = $state<Proposal[]>([]);
	let collabCount = $state(0);

	// --- Data Loading ---
	async function loadDashboardData() {
		try {
			const [_, proposalsData] = await Promise.all([
				conversationStore.loadConversations(),
				proposalService.getProposals(),
				fetchUserCollaborations()
			]);

			conversations = $conversationStore.conversations.slice(0, 5);
			proposals = (proposalsData || []).slice(0, 5);
			collabCount = getUserCollaborationItemsOnly().length;
		} catch (error) {
			console.error('Dashboard load error:', error);
		} finally {
			isLoaded = true;
		}
	}

	let _dashboardInitialized = false;
	$effect(() => {
		if (_dashboardInitialized) return;
		_dashboardInitialized = true;
		loadDashboardData();
	});

	// --- Derived ---
	let greeting = $derived(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});

	let userName = $derived(
		$profileStore.loading
			? ''
			: $profileStore.firstName || $profileStore.email?.split('@')[0] || ''
	);

	let today = $derived(
		new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
	);
</script>

<div class="min-h-screen w-full bg-gradient-to-b from-[#1A1A1A] to-[#141414] text-[#F5F5F5] p-6 sm:p-8 lg:p-10">
	{#if isLoaded}
		<div class="mx-auto max-w-5xl" in:fade={{ duration: 300 }}>

			<!-- Header -->
			<header class="mb-10" in:fly={{ y: -10, duration: 300 }}>
				<p class="text-[#6B7280] text-sm mb-1">{today}</p>
				<h1 class="text-2xl md:text-3xl font-semibold text-white tracking-tight">
					{greeting()}{#if userName}, {userName}{/if}
				</h1>
			</header>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
				<button
					onclick={() => goto('/dashboard/conversations')}
					class="group flex items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 text-left transition-all hover:border-[#3B82F6]/40 hover:bg-[#1E1E1E]/80"
				>
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] transition-colors group-hover:bg-[#3B82F6] group-hover:text-white">
						<Icon name="add" iconSize="xl" />
					</div>
					<div class="min-w-0">
						<span class="text-sm font-medium text-white block">New conversation</span>
						<span class="text-xs text-[#6B7280]">Ask the AI assistant</span>
					</div>
				</button>

				<!-- HIDDEN FOR DEMO
				<button
					onclick={() => goto('/dashboard/proposals')}
					class="group flex items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 text-left transition-all hover:border-[#A855F7]/40 hover:bg-[#1E1E1E]/80"
				>
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A855F7]/10 text-[#A855F7] transition-colors group-hover:bg-[#A855F7] group-hover:text-white">
						<Icon name="description" iconSize="xl" />
					</div>
					<div class="min-w-0">
						<span class="text-sm font-medium text-white block">New proposal</span>
						<span class="text-xs text-[#6B7280]">Draft a grant application</span>
					</div>
				</button>
				-->

				<button
					onclick={() => goto('/dashboard/collaborations')}
					class="group flex items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 text-left transition-all hover:border-[#10B981]/40 hover:bg-[#1E1E1E]/80"
				>
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981] transition-colors group-hover:bg-[#10B981] group-hover:text-white">
						<Icon name="groups" iconSize="xl" />
					</div>
					<div class="min-w-0">
						<span class="text-sm font-medium text-white block">Workspaces</span>
						<span class="text-xs text-[#6B7280]">{collabCount} active</span>
					</div>
				</button>
			</div>

			<!-- Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

				<!-- Recent Conversations -->
				<section in:fly={{ y: 15, delay: 100, duration: 300 }}>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-sm font-medium text-[#9CA3AF] uppercase tracking-wider">Conversations</h2>
						<button onclick={() => goto('/dashboard/conversations')} class="text-xs text-[#6B7280] hover:text-[#3B82F6] transition-colors">
							View all
						</button>
					</div>

					{#if conversations.length === 0}
						<div class="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-8 text-center">
							<div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2A2A]">
								<Icon name="chat_bubble_outline" iconSize="xl" />
							</div>
							<p class="text-sm text-[#6B7280] mb-3">No conversations yet</p>
							<button
								onclick={() => goto('/dashboard/conversations')}
								class="text-xs font-medium text-[#3B82F6] hover:text-[#93C5FD] transition-colors"
							>
								Start your first chat
							</button>
						</div>
					{:else}
						<div class="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] divide-y divide-[#2A2A2A]">
							{#each conversations as conv, i}
								<a
									href="/dashboard/conversations/{conv.id}"
									class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#252525] first:rounded-t-xl last:rounded-b-xl"
									in:fly={{ y: 8, delay: 150 + i * 40, duration: 250 }}
								>
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2A2A2A] text-[#6B7280] group-hover:text-[#3B82F6] transition-colors">
										<Icon name="chat" iconSize="sm" />
									</div>
									<span class="flex-1 truncate text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
										{conv.name || 'Untitled'}
									</span>
									<Icon name="chevron_right" className="w-4 h-4 text-[#404040] group-hover:text-[#6B7280] transition-colors" iconSize="sm" />
								</a>
							{/each}
						</div>
					{/if}
				</section>

				<!-- HIDDEN FOR DEMO: Recent Proposals 
				<section in:fly={{ y: 15, delay: 150, duration: 300 }}>
					...
				</section>
				-->
			</div>

		</div>
	{:else}
		<!-- Skeleton -->
		<div class="mx-auto max-w-5xl animate-pulse">
			<div class="mb-10">
				<div class="h-4 w-32 rounded bg-[#2A2A2A] mb-2"></div>
				<div class="h-8 w-64 rounded bg-[#2A2A2A]"></div>
			</div>
			<div class="grid grid-cols-3 gap-3 mb-10">
				{#each Array(3) as _}
					<div class="h-[72px] rounded-xl bg-[#1E1E1E] border border-[#2A2A2A]"></div>
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-6">
				{#each Array(2) as _}
					<div class="h-64 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A]"></div>
				{/each}
			</div>
		</div>
	{/if}
</div>
