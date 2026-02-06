<script lang="ts">
	import { page } from '$app/stores';
	import {
		getConversationMessages,
		addUserMessage,
		addAIMessage
	} from '$lib/clients/conversationService';
	import type { Message, Conversation, MessageWithSuggestions } from '$lib/types/schema';
	import type { StreamingMessage as StreamingMessageType } from '$lib/stores/streamingConversationStore';
	import type { Citation } from '$lib/types/schema';
	import { processRawCitationData } from '$lib/utils/citationConverter';

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
	import AgentReasoningView from '$lib/components/generic/agent-reasoning-view.svelte';
	import Icon from '$lib/components/generic/icon.svelte';

	type DisplayMessage =
		| { type: 'persisted', data: MessageWithSuggestions }
		| { type: 'streaming', data: StreamingMessageType };

	interface Props {
	  conversationId: number;
	}

	let { conversationId }: Props = $props();

	// State using runes
	let userInput = $state('');
	let messages = $state<MessageWithSuggestions[]>([]);
	let conversation = $state<Conversation | null>(null);
	let isLoading = $state(false);
	let isSending = $state(false);
	let error = $state<string | null>(null);

	// Reference to the messages container for auto-scrolling
	let messagesContainer: HTMLDivElement;

	// Scroll-to-bottom button visibility
	let showScrollDown = $state(false);

	function updateScrollDownVisibility() {
		if (!messagesContainer) return;
		const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
		showScrollDown = distanceFromBottom > 120; // show when user scrolled up a bit
	}

	function scrollToBottom() {
		if (!messagesContainer) return;
		messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
	}

	function scrollElementTopIntoView(container: HTMLElement, element: HTMLElement) {
		try {
			const containerRect = container.getBoundingClientRect();
			const elRect = element.getBoundingClientRect();
			const top = elRect.top - containerRect.top + container.scrollTop;
			container.scrollTop = Math.max(top - 72, 0);
		} catch (e) {
			console.error('Scroll error', e);
		}
	}

	// Derived state for conversation name handling
	let conversationName = $derived(conversation?.name || 'Untitled Conversation');

	// Use the provided conversationId prop
	let chatId = $derived(conversationId);

	// Track the last loaded chat ID to prevent duplicate loads
	let lastLoadedChatId = $state<number | null>(null);
	let isLoadingMessages = $state(false);

	// Combined and sorted messages for display
	let displayMessages = $derived.by(() => {
		const persisted = messages.map(m => ({ type: 'persisted' as const, data: m }));
		const streaming = $streamingConversationStore.messages
			.filter(m => m.sender === 'ai' && (m.isStreaming || m.isComplete))
			// Filter out streaming messages that are already in persisted messages to avoid duplicates
			.filter(streamMsg => !messages.some(pMsg =>
				pMsg.sender === 'ai' &&
				pMsg.text.trim() === streamMsg.text.trim()
			))
			.map(m => ({ 
				type: 'streaming' as const, 
				data: {
					...m,
					// Pass agent events from store to the streaming message
					agentEvents: m.sender === 'ai' && m.isStreaming 
						? $streamingConversationStore.agentEvents 
						: m.agentEvents
				}
			}));
			
		return [...persisted, ...streaming].sort((a, b) => {
			const timeA = new Date(a.type === 'persisted' ? a.data.createdAt : a.data.timestamp).getTime();
			const timeB = new Date(b.type === 'persisted' ? b.data.createdAt : b.data.timestamp).getTime();
			return timeA - timeB;
		});
	});

	// Function to check if a message should be grouped with the previous one
	function shouldGroupMessage(
		currentMessage: MessageWithSuggestions | StreamingMessageType,
		previousMessage: MessageWithSuggestions | StreamingMessageType | undefined
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

	// Function to handle progress updates
	function handleProgressUpdate(stage: string, message: string, extras?: any) {
		if (extras?.type === 'export' && extras.step !== undefined) {
			// Handle export progress
			streamingConversationStore.updateStage({
				stage: `export_step_${extras.step}`,
				message: message,
				timestamp: new Date().toISOString(),
				step: extras.step,
				totalSteps: extras.totalSteps
			});
		} else if (extras?.type === 'export_response') {
			// Handle export completion
			streamingConversationStore.updateStage({
				stage: 'export_complete',
				message: 'Export ready for download',
				timestamp: new Date().toISOString(),
				downloadUrl: extras.downloadUrl,
				fileType: extras.fileType,
				fileName: extras.fileName,
				packageContents: extras.packageContents
			});
		} else {
			// Handle regular progress
			streamingConversationStore.updateStage({
				stage,
				message,
				timestamp: new Date().toISOString(),
				...extras
			});
		}
	}

	// Function to check if this is the last message in a group (WhatsApp style)
	function isLastInGroup(
		currentMessage: MessageWithSuggestions | StreamingMessageType,
		nextMessage: MessageWithSuggestions | StreamingMessageType | undefined
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
		console.log('🔄 Effect triggered - chatId:', chatId, 'lastLoadedChatId:', lastLoadedChatId);
		if (chatId && chatId !== lastLoadedChatId) {
			console.log('🎯 Loading new conversation:', chatId);
			// Reset states when loading a new conversation
			isLoading = true;
			isLoadingMessages = false;
			error = null;
			messages = [];
			conversation = null;

			// Load both messages and conversation details
			console.log('📞 Calling loadMessages for conversation:', chatId);
			loadMessages(chatId);
			console.log('📞 Calling loadConversationDetails for conversation:', chatId);
			loadConversationDetails(chatId);
			streamingConversationStore.setConversation(chatId);
			// Reset streaming store to clear any leftover messages
			streamingConversationStore.reset();
			// Don't load existing messages into streaming store to avoid duplication
			// streamingConversationStore.loadExistingMessages(chatId);
			lastLoadedChatId = chatId;

			// Set a timeout to ensure loading state doesn't get stuck
			setTimeout(() => {
				if (isLoading) {
					console.warn('⏰ Loading timeout reached, resetting loading state');
					isLoading = false;
					if (!error) {
						error = 'Loading timeout - please try refreshing the page';
					}
				}
			}, 10000); // 10 second timeout
		} else {
			console.log('⏭️ Skipping load - same conversation or no chatId');
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
	!$streamingConversationStore.isProcessing &&
	!isSending &&
	!autostartProcessed
) {
	// Check if there are any messages and if the last message is a user message matching the autostart question
	const hasAIResponse = messages.some(msg => msg.sender === 'ai');
	
	// For new conversations (empty), add the user message to UI first
	if (messages.length === 0) {
		// Add the user message to the UI immediately
		const tempUserMessage: MessageWithSuggestions = {
			id: 0, // Temporary ID
			conversationId: chatId,
			text: autostartQuestion,
			sender: 'user',
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: null,
			// Add all required fields with default/null values
			aiProvider: null,
			aiVersion: null,
			modelUsed: null,
			dataSource: null,
			processingTime: null,
			projectsFound: null,
			logsQuestion: null,
			logsModelUsed: null,
			logsPhases: null,
			logsTotalProcessingTimeMs: null,
			logsProjectsRetrieved: null,
			logsProjectsProcessed: null,
			logsSuccess: null,
			logsAverageRelevanceScore: null,
			context: null
		};
		
		// Add the temporary user message to the messages array
		messages = [...messages, tempUserMessage];
		
		// Mark as processed to prevent re-triggering
		autostartProcessed = true;
		
		// Remove the autostart parameter from URL
		const url = new URL($page.url);
		url.searchParams.delete('autostart');
		window.history.replaceState({}, '', url.toString());
		
		// Start the AI response after a short delay to ensure the UI updates
		setTimeout(() => {
			startAIResponse(autostartQuestion);
		}, 100);
	}
	// For existing conversations, check if the last message matches
	else if (
		messages[messages.length - 1]?.sender === 'user' &&
		messages[messages.length - 1]?.text === autostartQuestion &&
		!hasAIResponse
	) {
		// Mark as processed to prevent re-triggering
		autostartProcessed = true;
		
		// Remove the autostart parameter from URL
		const url = new URL($page.url);
		url.searchParams.delete('autostart');
		window.history.replaceState({}, '', url.toString());
		
		// Start the AI response
		startAIResponse(autostartQuestion);
	}
	else {
		// If conditions don't match, just remove the autostart parameter
		autostartProcessed = true;
		const url = new URL($page.url);
		url.searchParams.delete('autostart');
		window.history.replaceState({}, '', url.toString());
	}
}
});

	// Reset autostart flag when navigating to a different conversation
	$effect(() => {
		if (chatId) {
			autostartProcessed = false;
		}
	});

	// Effect to anchor view to the top of the AI answer instead of bottom
	$effect(() => {
		if (!messagesContainer) return;

		// Prefer currently streaming AI message if present
		const streamingMessages = $streamingConversationStore.messages;
		const lastStreamingAi = [...streamingMessages].reverse().find((m) => m.sender === 'ai' && m.isStreaming);

		// Otherwise, use the last persisted AI message
		const lastPersistedAi = lastStreamingAi
			? null
			: [...messages].reverse().find((m) => m.sender === 'ai');

		setTimeout(() => {
			let targetEl: HTMLElement | null = null;

			if (lastStreamingAi) {
				targetEl = document.getElementById(`stream-msg-${lastStreamingAi.id}`) as HTMLElement | null;
			} else if (lastPersistedAi) {
				targetEl = document.getElementById(`msg-${lastPersistedAi.id}`) as HTMLElement | null;
			}

			if (targetEl) {
				scrollElementTopIntoView(messagesContainer, targetEl);
			}
		}, 10);
	});

	// Load conversation details using API endpoint
	async function loadConversationDetails(id: number) {
		console.log('🏠 loadConversationDetails called with ID:', id);
		try {
			console.log('📡 Fetching conversation details for ID:', id);
			const response = await fetch(`/api/conversations/${id}`, {
				method: 'GET'
			});

			console.log('📊 Conversation details response status:', response.status);
			const result = await response.json();
			console.log('📋 Conversation details response:', result);

			if (!response.ok) {
				console.error('❌ Error loading conversation details:', result.error);
				// Set error state for conversation loading failure and stop loading
				if (result.error === 'Unauthorized') {
					error = 'Please log in to access conversations';
				} else if (result.error === 'Conversation not found') {
					error = 'Conversation not found';
				} else {
					error = `Failed to load conversation: ${result.error}`;
				}
				isLoading = false; // Ensure loading state is reset on error
				return;
			}

			console.log('✅ Conversation details loaded successfully');
			conversation = result.conversation;
		} catch (err) {
			console.error('💥 Error loading conversation details:', err);
			error = 'Failed to load conversation details';
			isLoading = false; // Ensure loading state is reset on error
		}
	}

	async function loadMessages(id: number) {
		console.log('🔍 loadMessages called with ID:', id);
		if (isNaN(id)) {
			console.error('❌ Invalid conversation ID:', id);
			error = 'Invalid conversation ID';
			isLoading = false;
			isLoadingMessages = false;
			return;
		}

		// Prevent duplicate loading if already loading same conversation
		if (isLoadingMessages || (lastLoadedChatId === id && messages.length > 0)) {
			console.log('⏭️ Skipping duplicate message load for conversation:', id);
			return;
		}

		console.log('🚀 Starting to load messages for conversation:', id);
		isLoading = true;
		isLoadingMessages = true;
		error = null;

		try {
			console.log('📞 Calling getConversationMessages for conversation:', id);
			const loadedMessages = await getConversationMessages(id);

			// Check if we got an error response (empty array might indicate auth issues)
			if (!loadedMessages && loadedMessages !== []) {
				console.warn('Failed to load messages for conversation:', id);
				// Don't set error here - let conversation details loading handle auth errors
			} else {
				const validLoadedMessages = loadedMessages || [];
				
				// 1. Identify temporary user messages (ID = 0) currently in the UI
				const currentTempMessages = messages.filter(msg => msg.id === 0 && msg.sender === 'user');
				
				// 2. Filter out temporary messages that have been successfully persisted
				// We check if the loaded messages contain a message with the same text and approximate timestamp
				const remainingTempMessages = currentTempMessages.filter(tempMsg => {
					const isPersisted = validLoadedMessages.some(loadedMsg =>
						loadedMsg.sender === 'user' &&
						loadedMsg.text === tempMsg.text &&
						// Check if created within the last 30 seconds of the temp message
						Math.abs(new Date(loadedMsg.createdAt).getTime() - new Date(tempMsg.createdAt).getTime()) < 30000
					);
					return !isPersisted;
				});
				
				// 3. Convert loaded messages to MessageWithSuggestions
				const processedLoadedMessages = validLoadedMessages.map(msg => {
					const messageWithSuggestions = msg as MessageWithSuggestions;
					return messageWithSuggestions;
				});
				
				// 4. Combine loaded messages with remaining temporary messages
				let finalMessages = [...processedLoadedMessages, ...remainingTempMessages];
				
				// 5. Sort all messages by creation time to ensure correct order
				finalMessages.sort((a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
				
				// 6. Update the messages state
				messages = finalMessages;
				
				// 7. Clean up streaming store: Remove AI messages that are now persisted
				// This prevents duplication between the persisted list and the streaming view
				const streamingMsgs = $streamingConversationStore.messages;
				if (streamingMsgs.length > 0) {
					streamingMsgs.forEach(streamMsg => {
						if (streamMsg.sender === 'ai' && streamMsg.isComplete) {
							// Check if this streaming message is present in the persisted list
							const isPersisted = messages.some(m =>
								m.sender === 'ai' &&
								m.text.trim() === streamMsg.text.trim()
							);
							
							if (isPersisted) {
								console.log('Removing persisted streaming message from store:', streamMsg.id);
								streamingConversationStore.removeAIMessage(streamMsg.id);
							}
						}
					});
				}
				
				console.log('Loaded', messages.length, 'messages for conversation:', id);
			}
		} catch (err) {
			console.error('Error loading messages:', err);
			// Only set error if it's not an authentication issue (let conversation details handle that)
			if (err instanceof Error && err.message.includes('Unauthorized')) {
				error = 'Please log in to access conversations';
				isLoading = false; // Ensure loading state is reset on auth error
			} else {
				error = 'Failed to load conversation messages';
				isLoading = false; // Ensure loading state is reset on error
			}
		} finally {
			isLoading = false;
			isLoadingMessages = false;
		}
	}

	// Fetch available providers on init
	let _chatPageProvidersInit = false;
	$effect(() => {
		if (_chatPageProvidersInit) return;
		_chatPageProvidersInit = true;
		console.log('[PERSONAL CHAT PAGE] $effect FIRED — fetching providers');
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

	// Function to convert API citation format to our Citation type using enhanced converter
	function convertApiCitations(apiCitations: any[]): Citation[] {
		return processRawCitationData(apiCitations);
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
				(stage, message, extras) => {
					// Update progress indicator with enhanced handling
					handleProgressUpdate(stage, message, extras);
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
						const finalMessage: MessageWithSuggestions = {
							id: 0, // Will be set by the database
							conversationId: chatId,
							text: aiMessage.text,
							sender: 'ai',
							createdAt: new Date(),
							updatedAt: new Date(),
							userId: null,
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
							logsAverageRelevanceScore: metadata.logs?.average_relevance_score?.toString(),
							context: null
						};

						// Add citations if they exist in the streaming message
						if (metadata.citations && metadata.citations.length > 0) {
							const convertedCitations = convertApiCitations(metadata.citations);
							finalMessage.citations = convertedCitations;
						}

						// The AI message is now saved by the proxy endpoint.
						// We need to refresh the messages list to get the persisted message with its correct ID.
						console.log('AI message saved by proxy, refreshing messages list...');
						
						// Refresh messages to get the persisted AI message
						// The loadMessages function has logic to remove the streaming message once the persisted one is loaded
						setTimeout(() => {
							loadMessages(chatId).catch(err => {
								console.error('Error refreshing messages in background:', err);
							});
						}, 500); // Small delay to ensure DB write is complete
					} else {
						console.log('Streaming message not found, removing anyway');
						streamingConversationStore.removeAIMessage(messageId);
					}
				},
				async (error) => {
					// Handle error - mark as complete and add error message to UI
					console.log('Streaming error occurred, adding error message to UI...');

					// Create the error message object
					const errorMessage: MessageWithSuggestions = {
						id: 0, // Will be set by the database
						conversationId: chatId,
						text: error,
						sender: 'ai',
						createdAt: new Date(),
						updatedAt: new Date(),
						userId: null,
						// Add error metadata
						aiProvider: 'error',
						aiVersion: 'error',
						modelUsed: 'error',
						dataSource: 'error',
						processingTime: '0',
						projectsFound: 0,
						context: null,
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

					// For error messages, we still save them to the database as they're not handled by the proxy
					const savedMessage = await addAIMessage(chatId, errorMessage.text);

					if (savedMessage) {
						// Add the saved error message to the messages array
						messages = [...messages, savedMessage as MessageWithSuggestions];
					} else {
						// Add the error message to the messages array without saving (error case)
						messages = [...messages, errorMessage];
					}

					console.log('Error message added to UI, removing streaming message');
					streamingConversationStore.removeAIMessage(messageId);

					// Also set the error in the store for UI display
					streamingConversationStore.setError(error);
				},
				(event) => {
					// Handle V3 agent events
					streamingConversationStore.addAgentEvent(event);
				},
				(name, id) => {
					// Handle conversation name update
					if (id.toString() === chatId.toString()) {
						handleSaveConversationName(name);
					}
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

			// The user message is now saved by the proxy endpoint, so we don't need to save it here
			// Add the user message to the UI immediately for better UX
			const tempUserMessage: MessageWithSuggestions = {
				id: 0, // Temporary ID, will be replaced when messages are reloaded
				conversationId: chatId,
				text: currentInput,
				sender: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: null,
				// Add all required fields with default/null values for user messages
				aiProvider: null,
				aiVersion: null,
				modelUsed: null,
				dataSource: null,
				processingTime: null,
				projectsFound: null,
				logsQuestion: null,
				logsModelUsed: null,
				logsPhases: null,
				logsTotalProcessingTimeMs: null,
				logsProjectsRetrieved: null,
				logsProjectsProcessed: null,
				logsSuccess: null,
				logsAverageRelevanceScore: null,
				context: null
			};
			
			// Add the temporary user message to the messages array
			messages = [...messages, tempUserMessage];

			// Clear the input field
			userInput = '';
			isSending = false;

			// Start the AI response
			await startAIResponse(currentInput);
			
			// After the AI response is complete, the messages will be reloaded which will
			// replace the temporary user message with the one from the database
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
			onscroll={updateScrollDownVisibility}
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
					<div class="py-3">
						<!-- Show all messages (persisted + streaming) sorted by time -->
						{#each displayMessages as item, index}
							{@const message = item.data}
							{@const prevItem = displayMessages[index - 1]}
							{@const nextItem = displayMessages[index + 1]}
							{@const prevMessage = prevItem?.data}
							{@const nextMessage = nextItem?.data}
							
							{@const isGrouped = shouldGroupMessage(message, prevMessage)}
							{@const isLastInGroupFlag = isLastInGroup(message, nextMessage)}
							
							{#if item.type === 'persisted'}
								<div id={"msg-" + message.id} class="animate-fadeInUp">
									<ChatMessage {message} {isGrouped} isLastInGroup={isLastInGroupFlag} />
								</div>
							{:else}
								<div id={"stream-msg-" + message.id} class="animate-fadeInUp">
									<StreamingMessage {message} {isGrouped} isLastInGroup={isLastInGroupFlag} conversationId={chatId} />
								</div>
							{/if}
						{/each}

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

		{#if showScrollDown}
			<button
				onclick={scrollToBottom}
				class="absolute bottom-28 right-6 z-40 size-10 rounded-full bg-[#2C2C2C] text-[#E0E0E0] opacity-80 hover:opacity-100 shadow-md transition-colors transition-opacity hover:bg-[#4F4F4F] focus:outline-none flex items-center justify-center border border-[#4F4F4F]"
				aria-label="Scroll to bottom"
				title="Scroll to bottom"
			>
				<Icon name="arrow_downward" className="text-white text-lg" />
			</button>
		{/if}
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