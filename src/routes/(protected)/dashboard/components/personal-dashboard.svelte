<script lang="ts">
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { profileStore } from '$lib/stores/profileStore';
	import { conversationStore } from '$lib/stores/conversationStore';

	let greeting = $state('');
	let isLoaded = $state(false);
	let stats = $state({
		totalConversations: 0,
		activeCollaborations: 0,
		thisWeekMessages: 0,
		todayActivity: 0
	});

	// Recent activity mock data (could be replaced with real data from API)
	let recentActivity = $state([
		{
			type: 'conversation',
			title: 'New AI conversation started',
			time: '2 hours ago',
			icon: 'chat_bubble'
		},
		{
			type: 'collaboration',
			title: 'Joined Marketing Team collaboration',
			time: '1 day ago',
			icon: 'group'
		},
		{
			type: 'message',
			title: 'Received response from AI assistant',
			time: '3 hours ago',
			icon: 'smart_toy'
		}
	]);

	// Get greeting based on time of day
	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	// Load dashboard statistics
	async function loadStats() {
		try {
			// Mock stats for now - could be replaced with real API calls
			stats = {
				totalConversations: Math.floor(Math.random() * 20) + 5,
				activeCollaborations: Math.floor(Math.random() * 5) + 1,
				thisWeekMessages: Math.floor(Math.random() * 50) + 10,
				todayActivity: Math.floor(Math.random() * 8) + 2
			};
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	}

	onMount(async () => {
		greeting = getGreeting();
		await loadStats();

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
</script>

<div class="mx-auto max-w-6xl p-4 sm:p-6">
	{#if isLoaded}
		<!-- Header Section -->
		<div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
			<h1 class="text-2xl font-semibold text-[#E0E0E0] sm:text-3xl">{greeting}, {userName}</h1>
			<p class="mt-1 text-sm text-[#B0B0B0] sm:text-base">
				Welcome back to your personal workspace
			</p>
		</div>

		<!-- Statistics Cards -->
		<!-- <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" in:scale={{ duration: 300, delay: 100, start: 0.95 }}>
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 hover:scale-105 transition-transform">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-400 text-xs sm:text-sm font-medium">Total Conversations</p>
            <p class="text-white text-xl sm:text-2xl font-bold">{stats.totalConversations}</p>
          </div>
          <div class="bg-blue-500/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4 hover:scale-105 transition-transform">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-400 text-xs sm:text-sm font-medium">Active Collaborations</p>
            <p class="text-white text-xl sm:text-2xl font-bold">{stats.activeCollaborations}</p>
          </div>
          <div class="bg-purple-500/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4 hover:scale-105 transition-transform">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-400 text-xs sm:text-sm font-medium">This Week Messages</p>
            <p class="text-white text-xl sm:text-2xl font-bold">{stats.thisWeekMessages}</p>
          </div>
          <div class="bg-green-500/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-4 hover:scale-105 transition-transform">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-400 text-xs sm:text-sm font-medium">Today's Activity</p>
            <p class="text-white text-xl sm:text-2xl font-bold">{stats.todayActivity}</p>
          </div>
          <div class="bg-orange-500/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div> -->

		<!-- Main Action Cards -->
		<div
			class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
			in:scale={{ duration: 300, delay: 150, start: 0.95 }}
		>
			<div
				class="group rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg transition-all hover:border-[#4F4F4F]"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-3 transition-transform group-hover:scale-110"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-semibold text-[#E0E0E0]">My Collaborations</h2>
						<p class="text-sm text-[#B0B0B0]">Team up and work together</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-[#E0E0E0]">
					Join or create collaborative workspaces to share ideas, documents, and have team
					discussions with AI assistance.
				</p>
				<a
					href="/dashboard/collaborations"
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#8A2BE2] px-4 py-3 font-medium text-[#FFFFFF] transition-all hover:bg-[#A052E8]"
				>
					Explore Collaborations
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="ml-2 h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</a>
			</div>

			<div
				class="group rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg transition-all hover:border-[#4F4F4F]"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 p-3 transition-transform group-hover:scale-110"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
							/>
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-semibold text-[#E0E0E0]">My Conversations</h2>
						<p class="text-sm text-[#B0B0B0]">Chat with AI assistants</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-[#E0E0E0]">
					Start private conversations with AI to get help with research, writing, analysis, and
					answer any questions you have.
				</p>
				<a
					href="/dashboard/conversations"
					class="inline-flex w-full items-center justify-center rounded-lg bg-[#8A2BE2] px-4 py-3 font-medium text-[#FFFFFF] transition-all hover:bg-[#A052E8]"
				>
					Start Conversation
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="ml-2 h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</a>
			</div>
		</div>

		<!-- Recent Activity and Quick Tips -->
		<div
			class="grid grid-cols-1 gap-6 lg:grid-cols-3"
			in:scale={{ duration: 300, delay: 200, start: 0.95 }}
		>
			<!-- Recent Activity -->
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg lg:col-span-2">
				<h2 class="mb-6 flex items-center text-xl font-semibold text-[#E0E0E0]">
					<div class="mr-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					Recent Activity
				</h2>
				<div class="space-y-4">
					{#each recentActivity as activity, index}
						<div
							class="rounded-lg border border-[#444654]/30 bg-[#2a2b35] p-4 transition-colors hover:bg-[#34353f]"
							in:fade={{ delay: index * 50 }}
						>
							<div class="flex items-start">
								<div class="mt-1 flex-shrink-0">
									{#if activity.type === 'conversation'}
										<div class="rounded-lg bg-blue-500/20 p-2 text-blue-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
												/>
											</svg>
										</div>
									{:else if activity.type === 'collaboration'}
										<div class="rounded-lg bg-purple-500/20 p-2 text-purple-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
												/>
											</svg>
										</div>
									{:else}
										<div class="rounded-lg bg-green-500/20 p-2 text-green-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
												/>
											</svg>
										</div>
									{/if}
								</div>
								<div class="ml-3 flex-1">
									<p class="font-medium text-[#E0E0E0]">{activity.title}</p>
									<p class="mt-1 text-xs text-[#757575]">{activity.time}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quick Tips -->
			<div class="rounded-xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-lg">
				<h2 class="mb-6 flex items-center text-xl font-semibold text-[#E0E0E0]">
					<div class="mr-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 p-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							/>
						</svg>
					</div>
					Quick Tips
				</h2>
				<div class="space-y-4">
					<div
						class="rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
								</svg>
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
						class="rounded-lg border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm font-medium text-[#E0E0E0]">Keyboard shortcuts</p>
								<p class="mt-1 text-xs text-[#B0B0B0]">
									Press <kbd class="rounded bg-gray-700 px-1 py-0.5 text-xs">?</kbd> anywhere to view
									shortcuts.
								</p>
							</div>
						</div>
					</div>

					<div
						class="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4"
					>
						<div class="flex items-start">
							<div class="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
								</svg>
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
		<div class="mx-auto max-w-6xl p-4 sm:p-6">
			<div class="animate-pulse">
				<!-- Header skeleton -->
				<div class="mb-8">
					<div class="mb-2 h-8 w-64 rounded-lg bg-gray-700"></div>
					<div class="h-4 w-48 rounded bg-gray-700"></div>
				</div>

				<!-- Stats skeleton -->
				<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
					{#each Array(4) as _, i}
						<div class="h-20 rounded-lg bg-gray-700/50 p-4"></div>
					{/each}
				</div>

				<!-- Cards skeleton -->
				<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class="h-48 rounded-xl bg-gray-700/50"></div>
					<div class="h-48 rounded-xl bg-gray-700/50"></div>
				</div>

				<!-- Bottom section skeleton -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div class="h-64 rounded-xl bg-gray-700/50 lg:col-span-2"></div>
					<div class="h-64 rounded-xl bg-gray-700/50"></div>
				</div>
			</div>
		</div>
	{/if}
</div>
