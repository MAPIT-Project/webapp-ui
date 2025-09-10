<script lang="ts">
	import { onMount } from 'svelte';
	import type { Conversation } from '$lib/types/schema';
	import { page } from '$app/stores';
	import Icon from '$lib/components/generic/icon.svelte';
	import { conversationStore } from '$lib/stores/conversationStore';
	import EditableTitle from '$lib/components/generic/editable-title.svelte';
	import Modal from '$lib/components/generic/modal.svelte';
	import { getCurrentClient } from '$lib/clients/clientService';
	import { goto } from '$app/navigation';
	import { getSpace } from '$lib/stores/collaborationStore.svelte';

	// Get the current chat id from the URL if we're on a chat page
	const currentChatId = $derived(
		$page.params.conversation_id ? parseInt($page.params.conversation_id) : null
	);

	// Get current space to determine if we're in a collaboration
	const currentSpace = $derived(getSpace());
	const isCollaboration = $derived(currentSpace && currentSpace !== 'personal');
	const sidebarTitle = $derived(isCollaboration ? 'Team Chats' : 'Chats');

	let loadAttempts = $state(0);
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 2000; // 2 seconds

	// Delete functionality state
	let currentUser = $state<any>(null);
	let ownershipCache = $state<Map<number, boolean>>(new Map()); // Cache ownership checks
	let showDeleteConfirm = $state(false);
	let conversationToDelete = $state<Conversation | null>(null);
	let isDeleting = $state(false);
	let editableTitles: any[] = $state([]);

	async function loadWithRetry() {
		try {
			await conversationStore.loadConversations();
		} catch (err) {
			console.error('Failed to load conversations:', err);

			if (loadAttempts < MAX_RETRIES) {
				loadAttempts++;
				// Wait and try again
				setTimeout(loadWithRetry, RETRY_DELAY);
			}
		}
	}

	onMount(async () => {
		loadWithRetry();
		// Load current user for ownership checks
		try {
			currentUser = await getCurrentClient();
		} catch (err) {
			console.error('Error loading current user:', err);
		}
	});

	// Function to handle saving conversation name
	async function handleSaveConversationName(
		conversationId: number,
		newName: string
	): Promise<boolean> {
		return await conversationStore.updateConversationName(conversationId, newName);
	}

	// Check if current user is an owner of a collaboration conversation
	async function checkOwnership(conversation: Conversation): Promise<boolean> {
		// Only check for collaboration conversations
		const collaborationId = conversation.collaborationId || (conversation as any).collaboration_id;
		if (!collaborationId || !currentUser) {
			return false;
		}

		// Check cache first
		const cacheKey = conversation.id;
		if (ownershipCache.has(cacheKey)) {
			return ownershipCache.get(cacheKey)!;
		}

		try {
			const response = await fetch(`/api/collaborations/${collaborationId}/members`);
			const result = await response.json();

			if (response.ok && result.members) {
				const userMembership = result.members.find((member: any) => member.id === currentUser.id);
				const isOwner = userMembership?.role === 'owner';

				// Cache the result
				ownershipCache.set(cacheKey, isOwner);
				return isOwner;
			}
		} catch (err) {
			console.error('Error checking ownership:', err);
		}

		ownershipCache.set(cacheKey, false);
		return false;
	}

	// Handle delete button click
	async function handleDeleteClick(event: Event, conversation: Conversation) {
		event.preventDefault();
		event.stopPropagation();

		conversationToDelete = conversation;
		showDeleteConfirm = true;
	}

	// Handle conversation deletion
	async function handleDeleteConversation() {
		if (!conversationToDelete) return;

		isDeleting = true;
		showDeleteConfirm = false;

		try {
			const success = await conversationStore.deleteConversationById(conversationToDelete.id);

			if (success) {
				// Clear ownership cache for deleted conversation
				ownershipCache.delete(conversationToDelete.id);

				// If we're currently viewing the deleted conversation, navigate away
				if (currentChatId === conversationToDelete.id) {
					goto('/dashboard/conversations');
				}
			}
		} catch (err) {
			console.error('Error deleting conversation:', err);
		} finally {
			isDeleting = false;
			conversationToDelete = null;
		}
	}

	function formatDate(date: Date | string | null): string {
		if (!date) return '';

		try {
			// Convert string to Date if needed
			const dateObj = date instanceof Date ? date : new Date(date);

			// Check if date is valid
			if (isNaN(dateObj.getTime())) {
				return '';
			}

			const now = new Date();

			// If the date is today, return the time
			if (dateObj.toDateString() === now.toDateString()) {
				return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			}

			// If the date is within the last week, return the day of week
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
			if (dateObj > oneWeekAgo) {
				return dateObj.toLocaleDateString([], { weekday: 'short' });
			}

			// Otherwise return the date
			return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
		} catch (error) {
			console.error('Error formatting date:', error);
			return '';
		}
	}
</script>

<div
	class="flex h-full max-h-screen min-h-screen w-64 flex-shrink-0 flex-col overflow-hidden border-r border-[#404040]/20 bg-gradient-to-b from-[#1A1A1A] to-[#161616] shadow-xl"
>
	<!-- Header Section -->
	<div
		class="border-b border-[#404040]/20 bg-gradient-to-r from-[#2A2A2A]/30 to-[#202020]/30 px-4 py-2 backdrop-blur-sm"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-6 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
				>
					<Icon name="chat" iconClass="text-white" iconSize="xs" />
				</div>
				<h2 class="text-md font-semibold text-white">{sidebarTitle}</h2>
			</div>
			<div class="flex gap-1">
				<button
					class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
					title="Refresh conversations"
					onclick={() => conversationStore.loadConversations(true)}
				>
					<Icon
						name="refresh"
						iconClass="group-hover:rotate-180 transition-transform duration-300"
						iconSize="base"
					/>
				</button>
				<a
					href="/dashboard/conversations"
					class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-400"
					title="New chat"
				>
					<Icon
						name="add_comment"
						iconClass="group-hover:scale-110 transition-transform"
						iconSize="base"
					/>
				</a>
			</div>
		</div>
	</div>

	<!-- Conversations List -->
	<div class="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-2">
		{#if $conversationStore.isLoading}
			<!-- Enhanced Loading State -->
			<div class="flex h-32 flex-col items-center justify-center gap-4">
				<div class="relative">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-gray-700/30 border-t-blue-500"
					></div>
					<div
						class="absolute inset-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-r-purple-500"
						style="animation-direction: reverse; animation-duration: 1.5s;"
					></div>
				</div>
				<p class="text-sm font-medium text-gray-400">Loading conversations...</p>
			</div>
		{:else if $conversationStore.error}
			<!-- Enhanced Error State -->
			<div
				class="m-2 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900/20 to-red-800/20 p-4"
			>
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-lg bg-red-500/20 p-1.5">
						<Icon name="error" iconClass="text-red-400 w-4 h-4" />
					</div>
					<div class="flex-1">
						<p class="mb-1 text-sm font-medium text-red-300">Failed to load</p>
						<p class="mb-3 text-xs text-red-400">{$conversationStore.error}</p>
						<button
							class="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-600/30"
							onclick={() => conversationStore.loadConversations(true)}
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		{:else if $conversationStore.conversations.length === 0}
			<!-- Enhanced Empty State -->
			<div class="flex h-48 flex-col items-center justify-center gap-4 px-4">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-600/30 bg-gradient-to-br from-gray-700/20 to-gray-800/20"
				>
					<Icon name="chat" iconClass="text-gray-400 w-8 h-8" />
				</div>
				<div class="text-center">
					<h3 class="mb-1 font-medium text-white">No conversations yet</h3>
					<p class="text-sm leading-relaxed text-gray-400">
						Start a new conversation to begin chatting with AI assistants
					</p>
				</div>
				<a
					href="/dashboard/conversations"
					class="mt-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25"
				>
					Start First Chat
				</a>
			</div>
		{:else}
			<!-- Conversations List -->
			<div class="space-y-1">
				{#each $conversationStore.conversations as conversation, index}
					<a
						href="/dashboard/conversations/{conversation.id}"
						class="group relative flex items-start justify-between p-3 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/20 {currentChatId ===
						conversation.id
							? 'border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/10'
							: 'border border-transparent'} rounded-xl transition-all duration-200 hover:shadow-lg"
					>
						<div class="min-w-0 flex-1 pr-2">
							<div class="relative flex items-center justify-between">
								<div class="flex-1">
									<EditableTitle
										bind:this={editableTitles[index]}
										value={conversation.name || 'Untitled'}
										onSave={(newName) => handleSaveConversationName(conversation.id, newName)}
										placeholder="Untitled Conversation"
										maxLength={30}
										showEditIcon={false}
										compactMode={true}
										titleClass="text-white text-sm font-medium truncate {currentChatId ===
										conversation.id
											? 'text-blue-100'
											: 'group-hover:text-blue-100'}"
										inputClass="text-white text-sm font-medium bg-gray-800/50 border border-blue-500/50 rounded-lg px-2 py-1 outline-none w-full text-left"
										class="w-full overflow-hidden"
									/>
								</div>

							</div>

							<div class="mt-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<!-- Conversation type indicator -->
									{#if conversation.collaborationId || (conversation as any).collaboration_id}
										<div
											class="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5"
										>
											<Icon name="group" iconClass="w-3 h-3 text-purple-400" />
											<span class="text-xs font-medium text-purple-300">Team</span>
										</div>
									{:else}
										<div
											class="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5"
										>
											<Icon name="person" iconClass="w-3 h-3 text-blue-400" />
											<span class="text-xs font-medium text-blue-300">Personal</span>
										</div>
									{/if}
								</div>

								<span class="text-xs font-medium text-gray-500">
									{formatDate(conversation.createdAt)}
								</span>
							</div>

							{#if conversation.topic && conversation.topic !== 'General'}
								<p class="mt-1 truncate text-xs font-medium text-gray-400">
									{conversation.topic}
								</p>
							{/if}

							<!-- Delete button -->
							{#if currentUser}
								{#if conversation.collaborationId || (conversation as any).collaboration_id}
									{#await checkOwnership(conversation)}
										<!-- Loading ownership check -->
									{:then isOwner}
										{#if isOwner}
											<button
												onclick={(e) => handleDeleteClick(e, conversation)}
												class="absolute bottom-2 right-2 rounded-lg p-1.5 text-gray-500 opacity-0 transition-all duration-200 hover:scale-110 hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
												title="Delete conversation"
												disabled={isDeleting}
											>
												<Icon name="delete" iconClass="w-3.5 h-3.5" />
											</button>
										{/if}
									{:catch}
										<!-- Error checking ownership, don't show delete button -->
									{/await}
								{:else if (conversation as any).user_id === currentUser.id}
									<button
										onclick={(e) => handleDeleteClick(e, conversation)}
										class="absolute bottom-2 right-2 rounded-lg p-1.5 text-gray-500 opacity-0 transition-all duration-200 hover:scale-110 hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
										title="Delete conversation"
										disabled={isDeleting}
									>
										<Icon name="delete" iconClass="w-3.5 h-3.5" />
									</button>
								{/if}
							{/if}
							
						</div>

						<!-- Edit button -->
						{#if currentUser}
							<button
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); editableTitles[index]?.startEdit(); }}
								class="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700/70 hover:text-white hover:scale-110 rounded-lg z-10"
								title="Edit conversation name"
								aria-label="Edit conversation name"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<path
										d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
						{/if}

						<!-- Active indicator -->
						{#if currentChatId === conversation.id}
							<div
								class="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 transform rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600"
							></div>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t border-[#404040]/20 bg-gradient-to-r from-[#2A2A2A]/20 to-[#202020]/20 p-3">
		<div class="flex items-center justify-center">
			<div class="flex items-center gap-1 text-xs text-gray-500">
				<Icon name="info" iconClass="w-3 h-3" />
				<span
					>{$conversationStore.conversations.length} conversation{$conversationStore.conversations
						.length !== 1
						? 's'
						: ''}</span
				>
			</div>
		</div>
	</div>
</div>

<!-- Enhanced Delete Confirmation Modal -->
<Modal
	bind:isOpen={showDeleteConfirm}
	title="Delete Conversation"
	on:cancel={() => (showDeleteConfirm = false)}
	closeOnEscape={true}
	background="bg-[#1E1E1E] border border-[#4F4F4F] rounded-xl shadow-lg"
>
	<div slot="content" class="flex w-full flex-col gap-4 p-4">
		<div class="flex items-start gap-4">
			<div class="mt-1 flex-shrink-0">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-lg border border-[#F44336]/30 bg-[#F44336]/20"
				>
					<Icon name="warning" iconClass="text-[#F44336] w-6 h-6" />
				</div>
			</div>
			<div class="flex-1">
				<h3 class="mb-2 text-xl font-semibold text-[#E0E0E0]">
					Delete "{conversationToDelete?.name || 'this conversation'}"?
				</h3>
				<p class="mb-3 text-sm leading-relaxed text-[#B0B0B0]">
					This action cannot be undone. All messages and data in this conversation will be
					permanently deleted.
				</p>
				<div class="rounded-lg border border-[#F44336]/30 bg-[#F44336]/20 p-3">
					<div class="flex items-center gap-2">
						<Icon name="info" iconClass="text-[#F44336] w-4 h-4" />
						<span class="text-xs font-medium text-[#F44336]"
							>This will affect all team members with access to this conversation</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div slot="footer" class="flex justify-end gap-3 border-t border-[#4F4F4F]/50 p-4">
		<button
			onclick={() => (showDeleteConfirm = false)}
			class="rounded-lg bg-[#3A3A3A] px-4 py-2.5 font-medium text-[#FFFFFF] transition-all duration-200 hover:bg-[#4F4F4F] disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isDeleting}
		>
			Cancel
		</button>
		<button
			onclick={handleDeleteConversation}
			disabled={isDeleting}
			class="flex items-center justify-center gap-2 rounded-lg bg-[#F44336] px-4 py-2.5 font-medium text-[#FFFFFF] shadow-lg transition-all duration-200 hover:bg-[#D32F2F] hover:shadow-[#F44336]/25 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isDeleting}
				<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-[#FFFFFF]"></div>
				Deleting...
			{:else}
				<Icon name="delete" iconClass="w-4 h-4" />
				Delete Forever
			{/if}
		</button>
	</div>
</Modal>
