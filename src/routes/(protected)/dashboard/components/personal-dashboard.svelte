<script lang="ts">
	import { onMount } from 'svelte';
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

	// --- State ---
	let greeting = $state('');
	let isLoaded = $state(false);
	let stats = $state({
		totalConversations: 0,
		activeCollaborations: 0,
		totalProposals: 0,
		pendingTasks: 0
	});

	let recentActivity = $state<Array<{
		type: 'conversation' | 'collaboration' | 'proposal';
		title: string;
		subtitle?: string;
		time: string;
		icon: string;
		link?: string;
		status?: 'active' | 'draft' | 'completed';
	}>>([]);

	// --- Helpers ---
	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	// --- Data Loading ---
	async function loadDashboardData() {
		try {
			const [_, proposalsData] = await Promise.all([
				conversationStore.loadConversations(),
				proposalService.getProposals(),
				fetchUserCollaborations()
			]);

			const conversations = $conversationStore.conversations;
			const collaborations = getUserCollaborationItemsOnly();
			const proposals = proposalsData || [];
			
			// Calculate stats
			stats = {
				totalConversations: conversations.length,
				activeCollaborations: collaborations.length,
				totalProposals: proposals.length,
				pendingTasks: 3 // Mock for now
			};

			// Build Activity Feed
			const activity: typeof recentActivity = [];

			// 1. Recent Proposals
			proposals.slice(0, 3).forEach(p => {
				activity.push({
					type: 'proposal',
					title: p.proposal_title,
					subtitle: 'Proposal Draft',
					time: 'Updated recently',
					icon: 'description',
					link: `/dashboard/proposals/${p.proposal_id}/edit`,
					status: p.status as 'draft' | 'active' | 'completed' || 'draft'
				});
			});

			// 2. Recent Conversations
			conversations.slice(0, 3).forEach(c => {
				activity.push({
					type: 'conversation',
					title: c.name || 'Untitled Chat',
					subtitle: 'AI Conversation',
					time: 'Recent', // In real app, parse timestamp
					icon: 'chat',
					link: `/dashboard/conversations/${c.id}`,
					status: 'active'
				});
			});

			// Sort or interleave (simple slice for now)
			recentActivity = activity.slice(0, 5);

		} catch (error) {
			console.error('Dashboard load error:', error);
		} finally {
			isLoaded = true;
		}
	}

	onMount(async () => {
		greeting = getGreeting();
		await loadDashboardData();
	});

	// Derived User Name
	let userName = $derived(
		$profileStore.loading
			? 'Researcher'
			: $profileStore.firstName || $profileStore.email?.split('@')[0] || 'Researcher'
	);

	// Navigation Handlers
	const nav = (url: string) => window.location.href = url;
</script>

<div class="min-h-screen w-full bg-gradient-to-b from-[#1A1A1A] to-[#161616] text-[#F5F5F5] font-sans selection:bg-[#3B82F6] selection:text-white p-6 sm:p-8 lg:p-10 overflow-x-hidden">
	
	{#if isLoaded}
		<div in:fade={{ duration: 400 }}>
			
			<!-- Header Section -->
			<header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
				<div>
					<div class="text-[#3B82F6] text-sm font-medium mb-2 tracking-wide uppercase">Research Dashboard</div>
					<h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
						{greeting}, <span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#9ca3af]">{userName}</span>
					</h1>
					<p class="mt-2 text-[#B0B0B0] text-lg font-light">Here is what's happening with your projects today.</p>
				</div>
				
				<!-- Date Display -->
				<div class="hidden md:block text-right">
					<p class="text-2xl font-light text-white">{new Date().toLocaleDateString('en-GB', { weekday: 'long' })}</p>
					<p class="text-[#757575]">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
				</div>
			</header>

			<!-- Stats Overview (Glass Cards) -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
				{#each [
					{ label: 'Active Proposals', value: stats.totalProposals, icon: 'description', color: 'text-blue-400', bg: 'bg-blue-400/10' },
					{ label: 'Collaborations', value: stats.activeCollaborations, icon: 'group', color: 'text-purple-400', bg: 'bg-purple-400/10' },
					{ label: 'Conversations', value: stats.totalConversations, icon: 'chat', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
					{ label: 'Pending Tasks', value: stats.pendingTasks, icon: 'schedule', color: 'text-orange-400', bg: 'bg-orange-400/10' }
				] as stat, i}
					<div 
						class="relative overflow-hidden rounded-2xl border border-[#404040]/40 bg-[#1E1E1E]/60 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1E1E1E]/80 hover:shadow-lg hover:shadow-black/20 group"
						in:fly={{ y: 20, delay: i * 50 }}
					>
						<div class="flex justify-between items-start mb-4">
							<div class={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
								<Icon name={stat.icon} className="w-6 h-6" iconSize="xl" />
							</div>
							<span class="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
						</div>
						<p class="text-[#B0B0B0] text-sm font-medium">{stat.label}</p>
					</div>
				{/each}
			</div>

			<!-- Main Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Left Column: Recent Activity & Projects -->
				<div class="lg:col-span-2 space-y-8">
					
					<!-- Quick Action Bar (Search-like) -->
					<div class="relative group">
						<div class="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
						<div class="relative flex items-center bg-[#1E1E1E] border border-[#404040]/50 rounded-xl p-1 pr-2 shadow-xl">
							<div class="p-3 text-[#757575]">
								<Icon name="search" className="w-5 h-5" iconSize="xl" />
							</div>
							<input 
								type="text" 
								placeholder="Search projects, finding opportunities, or ask AI..." 
								class="w-full bg-transparent border-none text-white placeholder-[#757575] focus:ring-0 text-base h-10"
							/>
							<button class="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
								Search
							</button>
						</div>
					</div>

					<!-- Recent Activity Section -->
					<div>
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-xl font-semibold text-white flex items-center gap-2">
								<Icon name="history" className="w-5 h-5 text-[#3B82F6]" iconSize="xl" />
								Recent Activity
							</h2>
							<button 
                                class="text-sm text-[#3B82F6] hover:text-blue-300 transition-colors"
                                onclick={() => nav('/dashboard/proposals')}
                            >
                                View All
                            </button>
						</div>
						
						<div class="space-y-4">
							{#if recentActivity.length === 0}
								<div class="p-8 rounded-2xl border border-[#404040]/30 bg-[#1E1E1E]/40 text-center">
									<p class="text-[#757575]">No recent activity found.</p>
									<button onclick={() => nav('/dashboard/proposals')} class="mt-4 text-[#3B82F6] text-sm font-medium hover:underline">Create your first proposal</button>
								</div>
							{:else}
								{#each recentActivity as item, i}
									<a 
										href={item.link || '#'}
										class="block group relative rounded-xl border border-[#333333] bg-[#1E1E1E]/60 p-4 transition-all hover:bg-[#252525] hover:border-[#3B82F6]/50"
										in:fly={{ y: 10, delay: 200 + (i * 50) }}
									>
										<div class="flex items-center gap-4">
											<div class="h-12 w-12 rounded-full bg-[#2A2A2A] flex items-center justify-center border border-[#333] group-hover:border-[#3B82F6]/30 transition-colors">
												<Icon name={item.icon} className="w-5 h-5 text-[#B0B0B0] group-hover:text-[#3B82F6]" iconSize="xl" />
											</div>
											<div class="flex-1 min-w-0">
												<h3 class="text-white font-medium truncate group-hover:text-[#3B82F6] transition-colors">{item.title}</h3>
												<p class="text-sm text-[#757575] truncate">{item.subtitle} • {item.time}</p>
											</div>
											<div class="hidden sm:block">
												<Icon name="arrow_forward" className="w-5 h-5 text-[#404040] group-hover:text-[#3B82F6] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" iconSize="xl" />
											</div>
										</div>
									</a>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Column: Actions & Assistant -->
				<div class="space-y-6">
					
					<!-- Quick Actions Card -->
					<div class="rounded-2xl border border-[#404040]/40 bg-[#1E1E1E]/80 backdrop-blur-md p-6">
						<h3 class="text-white font-semibold mb-4">Quick Actions</h3>
						<div class="space-y-3">
							<button 
								onclick={() => nav('/dashboard/conversations')}
								class="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#333] border border-[#333] hover:border-[#3B82F6]/50 transition-all group text-left"
							>
								<div class="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
									<Icon name="chat_bubble_outline" className="w-5 h-5" iconSize="xl" />
								</div>
								<div>
									<div class="text-sm font-medium text-white">New Chat</div>
									<div class="text-xs text-[#757575]">Ask AI about anything</div>
								</div>
							</button>

							<button 
								onclick={() => nav('/dashboard/proposals')}
								class="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#333] border border-[#333] hover:border-[#A855F7]/50 transition-all group text-left"
							>
								<div class="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
									<Icon name="add_circle_outline" className="w-5 h-5" iconSize="xl" />
								</div>
								<div>
									<div class="text-sm font-medium text-white">Create Proposal</div>
									<div class="text-xs text-[#757575]">Start a new grant draft</div>
								</div>
							</button>

							<button 
								onclick={() => nav('/dashboard/organization')}
								class="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#333] border border-[#333] hover:border-[#10B981]/50 transition-all group text-left"
							>
								<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
									<Icon name="search" className="w-5 h-5" iconSize="xl" />
								</div>
								<div>
									<div class="text-sm font-medium text-white">Find Funding</div>
									<div class="text-xs text-[#757575]">Search opportunities</div>
								</div>
							</button>
						</div>
					</div>

					<!-- AI Assistant Widget -->
					<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white shadow-lg shadow-blue-900/20">
						<div class="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 blur-2xl"></div>
						
						<div class="relative z-10">
							<div class="flex items-center gap-2 mb-3">
								<Icon name="auto_awesome" className="w-5 h-5" iconSize="xl" />
								<h3 class="font-bold text-lg">AI Assistant</h3>
							</div>
							<p class="text-blue-100 text-sm mb-4 leading-relaxed">
								Need help analyzing a call document or drafting a section? I'm here to assist.
							</p>
							<button 
								onclick={() => nav('/dashboard/conversations')}
								class="w-full py-2.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
							>
								Ask Mapit AI
							</button>
						</div>
					</div>
				</div>

			</div>

		</div>
	{:else}
		<!-- Skeleton Loader -->
		<div class="animate-pulse space-y-8">
			<div class="h-20 w-1/3 bg-[#2C2C2C] rounded-xl"></div>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="h-32 bg-[#2C2C2C] rounded-2xl border border-[#333]"></div>
				{/each}
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div class="lg:col-span-2 h-96 bg-[#2C2C2C] rounded-2xl"></div>
				<div class="h-96 bg-[#2C2C2C] rounded-2xl"></div>
			</div>
		</div>
	{/if}
</div>
