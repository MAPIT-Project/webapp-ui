<script lang="ts">
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { profileStore } from '$lib/stores/profileStore';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { proposalService } from '$lib/clients/proposalService';
	import { getCurrentClient } from '$lib/clients/clientService';
	import {
		getUserCollaborationItemsOnly,
		getIsLoadingUserCollaborations,
		fetchUserCollaborations
	} from '$lib/stores/collaborationStore.svelte';
	import type { Proposal } from '$lib/types/proposal';
	import Icon from '$lib/components/generic/icon.svelte';

	let greeting = $state('');
	let isLoaded = $state(false);
	let stats = $state({
		totalConversations: 0,
		activeCollaborations: 0,
		totalProposals: 0,
		draftProposals: 0,
		thisWeekMessages: 0,
		todayActivity: 0
	});

	// Real data from stores
	let proposals = $state<Proposal[]>([]);
	let recentActivity = $state<Array<{
		type: 'conversation' | 'collaboration' | 'proposal' | 'message';
		title: string;
		time: string;
		icon: string;
		link?: string;
	}>>([]);
	let isLoadingProposals = $state(true);
	let isLoadingActivity = $state(true);

	// Get greeting based on time of day
	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	// Load dashboard statistics and data
	async function loadDashboardData() {
		try {
			// Load conversations
			await conversationStore.loadConversations();
			
			// Load proposals
			const proposalsData = await proposalService.getProposals();
			if (proposalsData) {
				proposals = proposalsData;
			}
			isLoadingProposals = false;
			
			// Load collaborations
			await fetchUserCollaborations();
			
			// Calculate real stats
			const conversations = $conversationStore.conversations;
			const collaborations = getUserCollaborationItemsOnly();
			const draftProposals = proposals.filter(p => p.status === 'draft').length;
			
			stats = {
				totalConversations: conversations.length,
				activeCollaborations: collaborations.length,
				totalProposals: proposals.length,
				draftProposals: draftProposals,
				thisWeekMessages: Math.floor(Math.random() * 50) + 10, // This would need a real API
				todayActivity: Math.floor(Math.random() * 8) + 2 // This would need a real API
			};
			
			// Generate recent activity from real data
			const activity: typeof recentActivity = [];
			
			// Add recent conversations
			conversations.slice(0, 2).forEach(conv => {
				activity.push({
					type: 'conversation',
					title: `Conversation: ${conv.name}`,
					time: 'Recently',
					icon: 'chat',
					link: `/dashboard/conversations/${conv.id}`
				});
			});
			
			// Add recent proposals
			proposals.slice(0, 2).forEach(prop => {
				activity.push({
					type: 'proposal',
					title: `Proposal: ${prop.proposal_title}`,
					time: 'Recently',
					icon: 'description',
					link: `/dashboard/proposals/${prop.proposal_id}/edit`
				});
			});
			
			// Add collaboration activity
			if (collaborations.length > 0) {
				activity.push({
					type: 'collaboration',
					title: `Active in ${collaborations.length} collaboration${collaborations.length > 1 ? 's' : ''}`,
					time: 'Active now',
					icon: 'group',
					link: '/dashboard/collaborations'
				});
			}
			
			recentActivity = activity.slice(0, 5);
			isLoadingActivity = false;
			
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			isLoadingProposals = false;
			isLoadingActivity = false;
		}
	}

	onMount(async () => {
		greeting = getGreeting();
		await loadDashboardData();

		// Simulate loading for smooth animation
		setTimeout(() => {
			isLoaded = true;
		}, 200);
	});

	// Use only the first name from the profile store for a more personal greeting
	let userName = $derived(
		$profileStore.loading
			? 'User'
			: $profileStore.firstName
				? $profileStore.firstName
				: $profileStore.email?.split('@')[0] || 'User'
	);
	
	// Quick action handlers
	function handleNewConversation() {
		window.location.href = '/dashboard/conversations';
	}
	
	function handleNewProposal() {
		window.location.href = '/dashboard/proposals';
	}
	
	function handleViewCollaborations() {
		window.location.href = '/dashboard/collaborations';
	}
</script>

<div class="mx-auto max-w-6xl p-4 sm:p-6" style="background-color: #121212; min-height: 100vh;">
	{#if isLoaded}
		<!-- Header Section -->
		<div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
			<h1 class="text-3xl font-bold text-[#E0E0E0] sm:text-4xl" style="font-family: Inter, sans-serif;">{greeting}, {userName}</h1>
			<p class="mt-2 text-base text-[#B0B0B0] sm:text-lg" style="font-family: Inter, sans-serif;">
				Welcome back to your personal workspace
			</p>
		</div>

		<!-- Statistics Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" in:scale={{ duration: 300, delay: 100, start: 0.95 }}>
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-4 shadow-lg transition-all hover:border-[#2196F3] hover:scale-105">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[#2196F3] text-xs sm:text-sm font-medium">Conversations</p>
						<p class="text-white text-xl sm:text-2xl font-bold">{stats.totalConversations}</p>
					</div>
					<div class="bg-[#2196F3]/20 p-2 rounded-lg">
						<Icon name="chat" className="h-5 w-5 text-[#2196F3]" />
					</div>
				</div>
			</div>
			
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-4 shadow-lg transition-all hover:border-[#2196F3] hover:scale-105">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[#2196F3] text-xs sm:text-sm font-medium">Collaborations</p>
						<p class="text-white text-xl sm:text-2xl font-bold">{stats.activeCollaborations}</p>
					</div>
					<div class="bg-[#2196F3]/20 p-2 rounded-lg">
						<Icon name="group" className="h-5 w-5 text-[#2196F3]" />
					</div>
				</div>
			</div>
			
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-4 shadow-lg transition-all hover:border-[#2196F3] hover:scale-105">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[#2196F3] text-xs sm:text-sm font-medium">Proposals</p>
						<p class="text-white text-xl sm:text-2xl font-bold">{stats.totalProposals}</p>
					</div>
					<div class="bg-[#2196F3]/20 p-2 rounded-lg">
						<Icon name="description" className="h-5 w-5 text-[#2196F3]" />
					</div>
				</div>
			</div>
			
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-4 shadow-lg transition-all hover:border-[#2196F3] hover:scale-105">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[#2196F3] text-xs sm:text-sm font-medium">Drafts</p>
						<p class="text-white text-xl sm:text-2xl font-bold">{stats.draftProposals}</p>
					</div>
					<div class="bg-[#2196F3]/20 p-2 rounded-lg">
						<Icon name="edit_note" className="h-5 w-5 text-[#2196F3]" />
					</div>
				</div>
			</div>
		</div>

		<!-- Main Action Cards -->
		<div
			class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
			in:scale={{ duration: 300, delay: 150, start: 0.95 }}
		>
			<div
				class="group rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg transition-all hover:border-[#2196F3]"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 rounded-xl bg-gradient-to-r from-[#2196F3] to-[#42A5F5] p-3 transition-transform group-hover:scale-110"
					>
						<Icon name="chat" className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-semibold text-[#E0E0E0]" style="font-family: Inter, sans-serif;">My Conversations</h2>
						<p class="text-sm text-[#B0B0B0]">Chat with AI assistants</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-[#E0E0E0]">
					Start private conversations with AI to get help with research, writing, analysis, and answer any questions you have.
				</p>
				<button
					onclick={handleNewConversation}
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#2196F3] px-4 py-3 font-medium text-white transition-all hover:bg-[#42A5F5]"
				>
					Start Conversation
					<Icon name="arrow_forward" className="ml-2 h-4 w-4" />
				</button>
			</div>

			<div
				class="group rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg transition-all hover:border-[#2196F3]"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 rounded-xl bg-gradient-to-r from-[#2196F3] to-[#42A5F5] p-3 transition-transform group-hover:scale-110"
					>
						<Icon name="description" className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-semibold text-[#E0E0E0]" style="font-family: Inter, sans-serif;">My Proposals</h2>
						<p class="text-sm text-[#B0B0B0]">Create and manage proposals</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-[#E0E0E0]">
					Create new proposals or continue working on existing ones with AI assistance and collaborative tools.
				</p>
				<button
					onclick={handleNewProposal}
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#2196F3] px-4 py-3 font-medium text-white transition-all hover:bg-[#42A5F5]"
				>
					Manage Proposals
					<Icon name="arrow_forward" className="ml-2 h-4 w-4" />
				</button>
			</div>

			<div
				class="group rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg transition-all hover:border-[#2196F3]"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 rounded-xl bg-gradient-to-r from-[#2196F3] to-[#42A5F5] p-3 transition-transform group-hover:scale-110"
					>
						<Icon name="group" className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-semibold text-[#E0E0E0]" style="font-family: Inter, sans-serif;">My Collaborations</h2>
						<p class="text-sm text-[#B0B0B0]">Team up and work together</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-[#E0E0E0]">
					Join or create collaborative workspaces to share ideas, documents, and have team discussions with AI assistance.
				</p>
				<button
					onclick={handleViewCollaborations}
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#2196F3] px-4 py-3 font-medium text-white transition-all hover:bg-[#42A5F5]"
				>
					Explore Collaborations
					<Icon name="arrow_forward" className="ml-2 h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Recent Activity and Quick Tips -->
		<div
			class="grid grid-cols-1 gap-6 lg:grid-cols-3"
			in:scale={{ duration: 300, delay: 200, start: 0.95 }}
		>
			<!-- Recent Activity -->
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg lg:col-span-2">
				<h2 class="mb-6 flex items-center text-xl font-semibold text-[#E0E0E0]" style="font-family: Inter, sans-serif;">
					<div class="mr-3 rounded-lg bg-gradient-to-r from-[#2196F3] to-[#42A5F5] p-2">
						<Icon name="bolt" className="h-5 w-5 text-white" />
					</div>
					Recent Activity
				</h2>
				<div class="space-y-4">
					{#if isLoadingActivity}
						<div class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]"></div>
						</div>
					{:else if recentActivity.length === 0}
						<div class="text-center py-8">
							<Icon name="info" className="h-12 w-12 text-[#757575] mx-auto mb-3" />
							<p class="text-[#B0B0B0]">No recent activity yet. Start a conversation or create a proposal!</p>
						</div>
					{:else}
						{#each recentActivity as activity, index}
							<a
								href={activity.link || '#'}
								class="block rounded-lg border border-[#3A3A3A] bg-[#2C2C2C] p-4 transition-all hover:border-[#2196F3] hover:bg-[#3A3A3A]"
								in:fade={{ delay: index * 50 }}
							>
								<div class="flex items-start">
									<div class="mt-1 flex-shrink-0">
										{#if activity.type === 'conversation'}
											<div class="rounded-lg bg-[#2196F3]/20 p-2 text-[#2196F3]">
												<Icon name="chat" className="h-4 w-4" />
											</div>
										{:else if activity.type === 'collaboration'}
											<div class="rounded-lg bg-[#2196F3]/20 p-2 text-[#2196F3]">
												<Icon name="group" className="h-4 w-4" />
											</div>
										{:else if activity.type === 'proposal'}
											<div class="rounded-lg bg-[#2196F3]/20 p-2 text-[#2196F3]">
												<Icon name="description" className="h-4 w-4" />
											</div>
										{:else}
											<div class="rounded-lg bg-[#4CAF50]/20 p-2 text-[#4CAF50]">
												<Icon name="smart_toy" className="h-4 w-4" />
											</div>
										{/if}
									</div>
									<div class="ml-3 flex-1">
										<p class="font-medium text-[#E0E0E0]">{activity.title}</p>
										<p class="mt-1 text-xs text-[#757575]">{activity.time}</p>
									</div>
								</div>
							</a>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Quick Tips -->
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg">
				<h2 class="mb-6 flex items-center text-xl font-semibold text-[#E0E0E0]" style="font-family: Inter, sans-serif;">
					<div class="mr-3 rounded-lg bg-gradient-to-r from-[#2196F3] to-[#42A5F5] p-2">
						<Icon name="lightbulb" className="h-5 w-5 text-white" />
					</div>
					Quick Tips
				</h2>
				<div class="space-y-4">
					<div
						class="rounded-lg border border-[#2196F3]/20 bg-gradient-to-r from-[#2196F3]/10 to-[#42A5F5]/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2196F3]">
								<Icon name="chat" className="h-5 w-5" />
							</div>
							<div class="ml-3">
								<p class="text-sm font-medium text-[#E0E0E0]">Use @mapit in chats</p>
								<p class="mt-1 text-xs text-[#B0B0B0]">
									Type @mapit followed by your question to get AI assistance in any chat.
								</p>
							</div>
						</div>
					</div>

					<div
						class="rounded-lg border border-[#4CAF50]/20 bg-gradient-to-r from-[#4CAF50]/10 to-emerald-500/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4CAF50]">
								<Icon name="keyboard" className="h-5 w-5" />
							</div>
							<div class="ml-3">
								<p class="text-sm font-medium text-[#E0E0E0]">Keyboard shortcuts</p>
								<p class="mt-1 text-xs text-[#B0B0B0]">
									Press <kbd class="rounded bg-[#3A3A3A] px-1 py-0.5 text-xs">?</kbd> anywhere to view shortcuts.
								</p>
							</div>
						</div>
					</div>

					<div
						class="rounded-lg border border-[#2196F3]/20 bg-gradient-to-r from-[#2196F3]/10 to-[#42A5F5]/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2196F3]">
								<Icon name="group_add" className="h-5 w-5" />
							</div>
							<div class="ml-3">
								<p class="text-sm font-medium text-[#E0E0E0]">Invite team members</p>
								<p class="mt-1 text-xs text-[#B0B0B0]">
									Create collaborations and invite colleagues to work together.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Enhanced Loading State -->
		<div class="mx-auto max-w-6xl p-4 sm:p-6" style="background-color: #121212; min-height: 100vh;">
			<div class="animate-pulse">
				<!-- Header skeleton -->
				<div class="mb-8">
					<div class="mb-2 h-10 w-80 rounded-lg bg-[#2C2C2C]"></div>
					<div class="h-5 w-64 rounded bg-[#2C2C2C]"></div>
				</div>

				<!-- Stats skeleton -->
				<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
					{#each Array(4) as _, i}
						<div class="h-24 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C] p-4"></div>
					{/each}
				</div>

				<!-- Cards skeleton -->
				<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div class="h-56 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]"></div>
					<div class="h-56 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]"></div>
					<div class="h-56 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]"></div>
				</div>

				<!-- Bottom section skeleton -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div class="h-80 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C] lg:col-span-2"></div>
					<div class="h-80 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]"></div>
				</div>
			</div>
		</div>
	{/if}
</div>
