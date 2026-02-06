<script lang="ts">
	import { page } from '$app/stores';
	import PersonalChatPage from './components/personal-chat-page.svelte';
	import PersonalChatContext from './components/personal-chat-context.svelte';
	import CollaborationChatPage from './components/collaboration-chat-page.svelte';

	// Get conversation ID from URL params
	let conversationId = $derived(parseInt($page.params.conversation_id));
	let isCollaborationConversation = $state<boolean | null>(null); // null = loading
	let isLoading = $state(true);

	// Load conversation details to determine if it's a collaboration conversation
	$effect(() => {
		if (conversationId) {
			loadConversationDetails(conversationId);
		}
	});

	async function loadConversationDetails(id: number) {
		isLoading = true;
		try {
			const response = await fetch(`/api/conversations/${id}`, {
				method: 'GET'
			});

			const result = await response.json();

			if (response.ok && result.conversation) {
				// Handle both snake_case (from API) and camelCase (from types)
				const conversation = result.conversation;
				isCollaborationConversation = !!(
					conversation.collaborationId || (conversation as any).collaboration_id
				);
			} else {
				console.error('Error loading conversation details:', result.error);
				isCollaborationConversation = false; // Default to personal on error
			}
		} catch (err) {
			console.error('Error loading conversation details:', err);
			isCollaborationConversation = false; // Default to personal on error
		} finally {
			isLoading = false;
		}
	}
</script>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="flex flex-col items-center gap-4">
			<div class="relative">
				<div class="h-12 w-12 rounded-full border-4 border-gray-700"></div>
				<div
					class="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
				></div>
			</div>
			<p class="text-sm text-gray-400">Loading conversation...</p>
		</div>
	</div>
{:else if isCollaborationConversation}
	<CollaborationChatPage conversationId={conversationId} />
{:else}
  <!-- Use the streaming chat interface for personal conversations -->
  <PersonalChatPage conversationId={conversationId} />
{/if}
