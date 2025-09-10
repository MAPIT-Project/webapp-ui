<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		getConversationMessages,
		addUserMessage,
		addAIMessage
	} from '$lib/clients/conversationService';
	import type { Message, Conversation } from '$lib/types/schema';
	import type { StreamingMessage as StreamingMessageType } from '$lib/stores/streamingConversationStore';

	import { fetchAvailableProviders, selectedVersion } from '$lib/stores/aiProviderStore';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { streamingClient } from '$lib/clients/streamingConversationClient';
	import { streamingConversationStore, conversationSummary } from '$lib/stores/streamingConversationStore';

	// Import components
	import ChatHeader from './ChatHeader.svelte';
	import ChatTitle from './ChatTitle.svelte';
	import ChatMessage from './ChatMessage.svelte';
	import StreamingMessage from '$lib/components/generic/streaming-message.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import ChatInput from './ChatInput.svelte';
	import ErrorMessage from './ErrorMessage.svelte';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';
	import ProcessingStageIndicator from '$lib/components/generic/processing-stage-indicator.svelte';

	interface Props {
	  conversationId: number;
	}

	let { conversationId }: Props = $props();

	// State using runes
	let userInput = $state('');
	let messages = $state<Message[]>([]);
	let conversation = $state<Conversation | null>(null);
	let isLoading = $state(false);
	let isSending = $state(false);
	let error = $state<string | null>(null);

	// Reference to the messages container for auto-scrolling
	let messagesContainer: HTMLDivElement;

	// Derived state for conversation name handling
	let conversationName = $derived(conversation?.name || 'Untitled Conversation');

	// Use the provided conversationId prop
	let chatId = $derived(conversationId);

	// Track the last loaded chat ID to prevent duplicate loads
	let lastLoadedChatId = $state<number | null>(null);

	// Function to check if a message should be grouped with the previous one
	function shouldGroupMessage(
		currentMessage: Message | StreamingMessageType,
		previousMessage: Message | StreamingMessageType | undefined
	): boolean {
		if (!previousMessage) return false;

		// Get timestamp from either createdAt (database) or timestamp (streaming)
		const currentTime = new Date(
			'createdAt' in currentMessage ? currentMessage.createdAt : currentMessage.timestamp
		).getTime();
		const previousTime = new Date(
			'createdAt' in previousMessage ? previousMessage.createdAt : previousMessage.timestamp
		).getTime();
		const timeDiff = currentTime - previousTime;
		const fiveMinutes = 5 * 60 * 1000;

		return currentMessage.sender === previousMessage.sender && timeDiff <= fiveMinutes;
	}

	// Function to check if this is the last message in a group (WhatsApp style)
	function isLastInGroup(
		currentMessage: Message | StreamingMessageType,
		nextMessage: Message | StreamingMessageType | undefined
	): boolean {
		if (!nextMessage) return true; // Last message overall

		// Get timestamp from either createdAt (database) or timestamp (streaming)
		const currentTime = new Date(
			'createdAt' in currentMessage ? currentMessage.createdAt : currentMessage.timestamp
		).getTime();
		const nextTime = new Date(
			'createdAt' in nextMessage ? nextMessage.createdAt : nextMessage.timestamp
		).getTime();
		const timeDiff = nextTime - currentTime;
		const fiveMinutes = 5 * 60 * 1000;

		return currentMessage.sender !== nextMessage.sender || timeDiff > fiveMinutes;
	}

	// Effect to load messages and conversation details when chatId changes
	$effect(() => {
		if (chatId && chatId !== lastLoadedChatId) {
			loadMessages(chatId);
			loadConversationDetails(chatId);
			streamingConversationStore.setConversation(chatId);
			// Don't load existing messages into streaming store to avoid duplication
			// streamingConversationStore.loadExistingMessages(chatId);
			lastLoadedChatId = chatId;
		}
	});

	// Track if autostart has been processed to prevent loops
	let autostartProcessed = $state(false);

	// Effect to check for autostart parameter and trigger AI response
$effect(() => {
	const autostartQuestion = $page.url.searchParams.get('autostart');
	if (
		autostartQuestion &&
		chatId &&
		messages.length > 0 &&
		!$streamingConversationStore.isProcessing &&
		!isSending &&
		!autostartProcessed
	) {
			// Only autostart if we have messages loaded and we're not already processing
			// This means the user message is already in the conversation
			autostartProcessed = true; // Set flag immediately to prevent re-triggering

			// Remove the autostart parameter from URL to prevent re-triggering
			const url = new URL($page.url);
			url.searchParams.delete('autostart');
			window.history.replaceState({}, '', url.toString());

			// Start the AI response
			startAIResponse(autostartQuestion);
		}
	});

	// Reset autostart flag when navigating to a different conversation
	$effect(() => {
		if (chatId) {
			autostartProcessed = false;
		}
	});

	// Effect to scroll to bottom when messages change
	$effect(() => {
		if (messagesContainer && (messages.length > 0 || isSending || $streamingConversationStore.isProcessing)) {
			// Use setTimeout to ensure DOM has updated
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 10);
		}
	});

	// Load conversation details using API endpoint
	async function loadConversationDetails(id: number) {
		try {
			const response = await fetch(`/api/conversations/${id}`, {
				method: 'GET'
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Error loading conversation details:', result.error);
				return;
			}

			conversation = result.conversation;
		} catch (err) {
			console.error('Error loading conversation details:', err);
		}
	}

	async function loadMessages(id: number) {
		if (isNaN(id)) {
			error = 'Invalid conversation ID';
			return;
		}

		isLoading = true;
		error = null;

		try {
			messages = await getConversationMessages(id);
		} catch (err) {
			console.error('Error loading messages:', err);
			error = 'Failed to load conversation messages';
		} finally {
			isLoading = false;
		}
	}

	// On mount, fetch available providers
	onMount(() => {
		fetchAvailableProviders();
	});

	// Function to handle saving conversation name
	async function handleSaveConversationName(newName: string): Promise<boolean> {
		if (!conversation) return false;

		const success = await conversationStore.updateConversationName(conversation.id, newName);
		if (success && conversation) {
			// Update local conversation object
			conversation = { ...conversation, name: newName };
		}
		return success;
	}

	async function startAIResponse(question: string) {
		if ($streamingConversationStore.isProcessing || isSending) return;

		error = null;

		try {
			// Start AI response in the store
			const messageId = streamingConversationStore.startAIResponse();

			// Use the streaming client to send the message
			await streamingClient.sendStreamingMessage(
				chatId,
				question,
				true, // include context
				(stage, message) => {
					// Update progress indicator
					streamingConversationStore.updateStage({
						stage,
						message,
						timestamp: new Date().toISOString()
					});
				},
				(content) => {
					// Append token to AI message
					streamingConversationStore.appendToAIMessage(messageId, content);
				},
				async (metadata) => {
					// Handle completion - mark as complete and add final message to UI
					streamingConversationStore.completeAIMessage(messageId, metadata);

					console.log('Streaming complete, adding final message to UI...');

					// Create the final message object from the streaming message
					const streamingMessages = $streamingConversationStore.messages;
					const aiMessage = streamingMessages.find(m => m.id === messageId && m.sender === 'ai');

					if (aiMessage) {
						// Convert streaming message to database message format
						const finalMessage: Message = {
							id: Date.now(), // Temporary ID until database sync
							conversationId: chatId,
							text: aiMessage.text,
							sender: 'ai',
							createdAt: new Date(),
							// Add metadata fields
							aiProvider: metadata.ai_provider,
							aiVersion: metadata.ai_version,
							modelUsed: metadata.model_used,
							dataSource: metadata.data_source,
							processingTime: metadata.processing_time?.toString(),
							projectsFound: metadata.projects_found,
							// Map logs to individual fields
							logsQuestion: metadata.logs?.question,
							logsModelUsed: metadata.logs?.model_used,
							logsPhases: metadata.logs?.phases ? JSON.stringify(metadata.logs.phases) : null,
							logsTotalProcessingTimeMs: metadata.logs?.total_processing_time_ms,
							logsProjectsRetrieved: metadata.logs?.projects_retrieved,
							logsProjectsProcessed: metadata.logs?.projects_processed,
							logsSuccess: metadata.logs?.success,
							logsAverageRelevanceScore: metadata.logs?.average_relevance_score?.toString()
						};

						// Add the final message to the messages array
						messages = [...messages, finalMessage];

						console.log('Final message added to UI, removing streaming message');
						streamingConversationStore.removeAIMessage(messageId);
					} else {
						console.log('Streaming message not found, removing anyway');
						streamingConversationStore.removeAIMessage(messageId);
					}
				},
				async (error) => {
					// Handle error - mark as complete and add error message to UI
					console.log('Streaming error occurred, adding error message to UI...');

					// Create the error message object
					const errorMessage: Message = {
						id: Date.now(), // Temporary ID until database sync
						conversationId: chatId,
						text: error,
						sender: 'ai',
						createdAt: new Date(),
						// Add error metadata
						aiProvider: 'error',
						aiVersion: 'error',
						modelUsed: 'error',
						dataSource: 'error',
						processingTime: '0',
						projectsFound: 0,
						// Add error logs
						logsQuestion: question,
						logsModelUsed: 'error',
						logsPhases: JSON.stringify(['error']),
						logsTotalProcessingTimeMs: 0,
						logsProjectsRetrieved: 0,
						logsProjectsProcessed: 0,
						logsSuccess: false,
						logsAverageRelevanceScore: '0'
					};

					// Add the error message to the messages array
					messages = [...messages, errorMessage];

					console.log('Error message added to UI, removing streaming message');
					streamingConversationStore.removeAIMessage(messageId);

					// Also set the error in the store for UI display
					streamingConversationStore.setError(error);
				}
			);

		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			console.error('AI response error:', err);
		}
	}

	async function handleSubmit() {
		if (!userInput.trim() || $streamingConversationStore.isProcessing || isSending) return;

		isSending = true;
		error = null;

		try {
			// Store the current input before clearing it
			const currentInput = userInput;

			// Add the user message to the database for persistence
			const userMessage = await addUserMessage(chatId, currentInput);

			if (userMessage) {
				// Only add to database messages array, streaming store will handle UI
				messages = [...messages, userMessage];
			}

			// Add user message to streaming store for immediate UI display
			streamingConversationStore.addUserMessage(currentInput);

			// Clear the input field
			userInput = '';
			isSending = false;

			// Start the AI response
			await startAIResponse(currentInput);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			isSending = false;
			console.error('Chat error:', err);
		}
	}

	function stopStreaming() {
		streamingClient.closeConnection();
		streamingConversationStore.setError('Streaming stopped by user');
	}

	// Helper functions for message grouping
	function handleUserInputChange(value: string) {
		userInput = value;
	}

	function handleChatInputSubmit() {
		handleSubmit();
	}

	function handleStopStreaming() {
		stopStreaming();
	}
</script>

<!-- Modern dark grey gradient background -->
<div
	class="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]"
>
	<!-- Subtle pattern overlay for texture -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
	></div>

	<!-- Top header with modern backdrop -->
	<div class="relative z-30">
		<ChatHeader />
	</div>

	<!-- Main chat container with full-width scrollable area -->
	<div class="relative z-10 flex h-full w-full flex-1 flex-col overflow-hidden pt-8">
		<!-- Chat title area - centered content -->
		<!-- <div class="w-full max-w-4xl mx-auto px-6">
            <ChatTitle
                {conversation}
                {isLoading}
                {conversationName}
                onSave={handleSaveConversationName}
            />
        </div> -->

		<!-- Chat messages area with full-width scrollbar -->
		<div
			class="scrollbar-thin min-h-0 flex-1 overflow-y-auto scroll-smooth pb-6"
			bind:this={messagesContainer}
		>
			<!-- Centered content container -->
			<div class="mx-auto w-full max-w-4xl px-6">
				{#if isLoading}
					<div class="mt-8">
						<LoadingState />
					</div>
				{:else if messages.length === 0}
					<div class="mt-8">
						<EmptyState />
					</div>
				{:else}
					<div class="space-y-1 pb-8 pt-6">
						<!-- Show database messages (persisted) -->
						{#each messages as message, index}
							{@const isGrouped = shouldGroupMessage(message, messages[index - 1])}
							{@const isLastInGroupFlag = isLastInGroup(message, messages[index + 1])}
							<div class="animate-fadeInUp">
								<ChatMessage {message} {isGrouped} isLastInGroup={isLastInGroupFlag} />
							</div>
						{/each}

						<!-- Show streaming AI message (temporary UI state during streaming) -->
						{#if $streamingConversationStore.isProcessing}
							{#each $streamingConversationStore.messages as message, index}
								{#if message.sender === 'ai' && message.isStreaming}
									{@const isGrouped = shouldGroupMessage(message, messages[messages.length - 1])}
									{@const isLastInGroupFlag = true}
									<div class="animate-fadeInUp">
										<StreamingMessage {message} {isGrouped} isLastInGroup={isLastInGroupFlag} />
									</div>
								{/if}
							{/each}
						{/if}

						<!-- Processing stage indicator -->
						{#if $streamingConversationStore.currentStage}
							<div class="animate-fadeInUp mb-4">
								<ProcessingStageIndicator stage={$streamingConversationStore.currentStage} />
							</div>
						{/if}

						<!-- Typing indicator with modern styling -->
						{#if isSending}
							<div class="animate-fadeInUp">
								<TypingIndicator />
							</div>
						{/if}
					</div>
				{/if}

				<!-- Error message with modern styling -->
				{#if error}
					<div class="animate-fadeInUp mt-4">
						<ErrorMessage {error} />
					</div>
				{/if}
			</div>
		</div>

		<!-- Input area - centered content -->
		<div class="mx-auto w-full max-w-4xl px-6">
			<ChatInput
				{userInput}
				isStreaming={$streamingConversationStore.isProcessing}
				{isSending}
				streamingProgress={$streamingConversationStore.currentStage?.message || ''}
				onInputChange={handleUserInputChange}
				onSubmit={handleChatInputSubmit}
				onStopStreaming={handleStopStreaming}
			/>
		</div>
	</div>

	<!-- Subtle bottom gradient overlay -->
	<div
		class="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414]/80 to-transparent"
	></div>
</div>

<style>
	/* Modern animations */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeInUp {
		animation: fadeInUp 0.4s ease-out forwards;
	}

	/* Custom scrollbar styling */
	.scrollbar-thin::-webkit-scrollbar {
		width: 6px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: rgba(64, 64, 64, 0.4);
		border-radius: 3px;
		transition: background-color 0.2s ease;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background-color: rgba(80, 80, 80, 0.7);
	}

	/* Modern glass effect */
	.backdrop-blur-md {
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.backdrop-blur-sm {
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}
</style>