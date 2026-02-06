<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import AgentReasoningView from '$lib/components/generic/agent-reasoning-view.svelte';
	import type { MessageWithSuggestions } from '$lib/types/schema';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { renderTextWithCitationSpans } from '$lib/utils/citationRenderer';
	import type { Citation } from '$lib/types/schema';
	import type { EnhancedCitation } from '$lib/utils/citationConverter';
	import CitationSources from '$lib/components/generic/citation-sources.svelte';
	import FeedbackWidget from '$lib/components/feedback/feedback-widget.svelte';

	let copied = $state(false);
	let showSources = $state(false);
	
	// Extract metrics for feedback
	let toolsUsed = $derived.by(() => {
		if (message.logsPhases) {
			try {
				const parsed = JSON.parse(message.logsPhases);
				return parsed.tools_used || [];
			} catch (e) { return []; }
		}
		return [];
	});
	
	let responseTimeMs = $derived.by(() => {
		if (message.logsTotalProcessingTimeMs) return message.logsTotalProcessingTimeMs;
		if (message.processingTime) return Number(message.processingTime) * 1000;
		return undefined;
	});

	async function copyMessage(text: string) {
		try {
			await navigator.clipboard.writeText(text || '');
			copied = true;

			// reset after a short delay (2 seconds for clearer feedback)
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}

	interface Props {
		message: MessageWithSuggestions;
		isGrouped: boolean;
		isLastInGroup: boolean;
	}

	let { message, isGrouped, isLastInGroup }: Props = $props();

	// Type assertion for enhanced citations
	let enhancedCitations = $derived(
		(message.citations || []) as EnhancedCitation[]
	);

	// Helper functions
	function formatMessageTime(date: Date | string): string {
		console.log('formatMessageTime called with:', date, typeof date);
		if (!date) {
			console.log('No date provided, returning empty string');
			return '';
		}

		try {
			const dateObj = date instanceof Date ? date : new Date(date);
			console.log('Parsed date object:', dateObj, 'isValid:', !isNaN(dateObj.getTime()));

			// Check if date is valid
			if (isNaN(dateObj.getTime())) {
				console.log('Date is invalid, returning empty string');
				return '';
			}

			const formatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			console.log('Formatted time:', formatted);
			return formatted;
		} catch (error) {
			console.error('Error formatting message time:', error);
			return '';
		}
	}

	// Function to get the creation date from message (handles both camelCase and snake_case)
	function getMessageCreatedAt(message: MessageWithSuggestions): string | Date | null {
		// First try camelCase (TypeScript schema)
		if (message.createdAt) {
			return message.createdAt;
		}

		// Then try snake_case (API response)
		if ((message as any).created_at) {
			return (message as any).created_at;
		}

		// Return null if neither exists
		return null;
	}

	// Function to check if a message is an error
	function isErrorMessage(text: string): boolean {
		return text.startsWith('Error:');
	}

	// Function to safely render markdown
	function renderMarkdown(text: string): string {
		try {
			// Configure marked options for better formatting
			marked.setOptions({
				gfm: true,
				breaks: true // Convert \n to <br>
			});

			// Clean up the raw markdown to avoid leading blank paragraphs
			// 1) remove any leading whitespace/newlines
			// 2) collapse 3+ consecutive newlines into two (one blank line)
			const cleaned = String(text || '')
				.replace(/^[\s\uFEFF\xA0]+/, '')
				.replace(/\n{3,}/g, '\n\n');

			// Parse markdown and sanitize HTML
			const parsed = marked.parse(cleaned) as string;
			let sanitized = DOMPurify.sanitize(parsed) as string;

			// Post-process to add target="_blank" to all links
			sanitized = sanitized.replace(
				/<a\s+href="([^"]*)"([^>]*)>/g,
				'<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
			);

			return sanitized;
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return text;
		}
	}

	// Function to highlight @mapit in messages
	function highlightMapitInMessage(text: string): string {
		// Replace @mapit (case insensitive) with highlighted version
		return text.replace(
			/@mapit\b/gi,
			'<span class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-1 py-0.5 rounded font-semibold text-sm shadow-sm border border-emerald-400/30">@mapit</span>'
		);
	}

	// Function to handle follow-up suggestion clicks
	function handleFollowUpClick(suggestion: string) {
		// Dispatch custom event for parent component to handle
		const event = new CustomEvent('followUpClick', {
			detail: { suggestion },
			bubbles: true
		});
		// Dispatch on the window or document since we can't dispatch on message object
		window.dispatchEvent(event);
	}

	// Function to render message content with citations
	function renderMessageContent(): string {
		let content = message.text;
		
		// First, highlight @mapit
		content = highlightMapitInMessage(content);
		
		// Then, if this is an AI message with citations, replace citation markers with HTML spans
		if (message.sender === 'ai' && message.citations && message.citations.length > 0) {
			content = renderTextWithCitationSpans(content, message.citations);
		}
		
		// Finally, render markdown
		return renderMarkdown(content);
	}

	// Get message content as HTML
	const messageContentHtml = $derived(renderMessageContent());

	// Handle citation clicks
	function handleCitationClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('citation-marker')) {
			const citationId = target.getAttribute('data-citation-id');
			const citationData = target.getAttribute('data-citation');
			
			if (citationId && citationData) {
				try {
					const citation = JSON.parse(citationData);
					showCitationPopover(citation, event);
				} catch (error) {
					console.error('Error parsing citation data:', error);
				}
			}
		}
	}

	// Citation popover state
	let showPopover = $state(false);
	let currentCitation = $state<EnhancedCitation | null>(null);
	let popoverPosition = $state({ x: 0, y: 0 });

	function showCitationPopover(citation: EnhancedCitation, event: MouseEvent) {
		currentCitation = citation;
		popoverPosition = { x: event.clientX, y: event.clientY };
		showPopover = true;
	}

	function closeCitationPopover() {
		showPopover = false;
		currentCitation = null;
	}

	// Add click event listener to the message content
	let _chatMsgMounted = false;
	$effect(() => {
		if (_chatMsgMounted) return;
		_chatMsgMounted = true;
		const messageContent = document.getElementById(`message-content-${message.id}`);
		if (messageContent) {
			messageContent.addEventListener('click', handleCitationClick);
		}
	});

	function toggleSources() {
		showSources = !showSources;
	}

	function getAgentEventsFromLogs(logsPhases: string | null | undefined): any[] {
		if (!logsPhases) return [];
		try {
			const parsed = JSON.parse(logsPhases);
			// Check if it's the V3 format with reasoning_steps
			if (parsed.reasoning_steps && Array.isArray(parsed.reasoning_steps)) {
				return parsed.reasoning_steps.flatMap((step: any) => {
					const events = [];
					// Thought
					if (step.thought) {
						events.push({
							type: 'agent_thinking',
							stage: 'reasoning',
							iteration: step.step,
							thought: step.thought
						});
					}
					// Tool Call (Action)
					if (step.action === 'call_tools' && step.tools_called) {
						step.tools_called.forEach((tool: string) => {
							events.push({
								type: 'tool_call',
								stage: 'executing_tool',
								tool_name: tool,
								iteration: step.step
							});
						});
					}
					// Tool Result (Observation)
					if (step.observation) {
						events.push({
							type: 'tool_result',
							stage: 'tool_complete',
							result_summary: typeof step.observation === 'string' && step.observation.length > 100 
								? step.observation.substring(0, 100) + '...' 
								: JSON.stringify(step.observation).substring(0, 100) + '...',
							success: true,
							iteration: step.step
						});
					}
					return events;
				});
			}
			return [];
		} catch (e) { return []; }
	}

	let agentEvents = $derived(getAgentEventsFromLogs(message.logsPhases || (message as any).logs_phases));
</script>

<div class="group relative {isGrouped ? 'mt-0.5' : 'mt-8 pt-4'} animate-[fadeInUp_0.3s_ease-out]">
	<div class="flex items-start gap-4 {message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}">
		<!-- Avatar - only show for first message in group -->
		<div class="flex-shrink-0 {isGrouped ? 'invisible' : ''}">
			{#if message.sender === 'user'}
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 shadow-lg">
					<Icon name="person" className="text-white text-sm" />
				</div>
			{:else}
				<div
					class="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-lg"
				>
					<!-- <Icon name="smart_toy" className="text-white text-sm" /> -->
					<img src="/images/mapit_logo_no_bg.png" class="size-4 object-contain" alt="MAPIT Logo" />
				</div>
			{/if}
		</div>

		<!-- Message bubble -->
		<div class="max-w-[85ch] flex-1 {message.sender === 'user' ? 'text-right' : 'text-left'}">
			<div class="inline-block  align-top">
				{#if message.sender === 'user'}
					<div
						class=" relative rounded-lg px-3 py-2 text-white {isGrouped
							? 'rounded-tr-lg'
							: 'rounded-tr-sm'} backdrop-blur-sm"
					>
						<div class="prose prose-sm max-w-none">
							<p class="m-0 whitespace-pre-wrap text-sm leading-relaxed">
								{@html highlightMapitInMessage(message.text)}
							</p>
						</div>
						<div class="text-right">
							<span class="text-xs text-gray-500/70 font-medium">
								{formatMessageTime(getMessageCreatedAt(message) || '')}
							</span>
						</div>
						<!-- no copy button for user messages -->
					</div>
				{:else if isErrorMessage(message.text)}
					<!-- Error message styling -->
					<div
						class="relative rounded-lg border border-red-400/40 px-3 py-2 text-red-300 {isGrouped
							? 'rounded-tl-lg'
							: 'rounded-tl-sm'} backdrop-blur-sm"
					>
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 pt-1">
								<Icon name="error" className="text-red-400 text-sm" />
							</div>
							<div class="flex-1">
								<div class="prose prose-sm max-w-none">
									<p class="m-0 whitespace-pre-wrap text-sm leading-relaxed text-red-300">
										{message.text}
									</p>
								</div>
							</div>
						</div>
						<div class="text-right">
							<span class="text-xs text-red-400/80 font-medium">
								{formatMessageTime(getMessageCreatedAt(message) || '')}
							</span>
						</div>
						<!-- no copy button for error messages -->
					</div>
				{:else}
					<!-- Normal AI response -->
					<div class="group/ai relative inline-block max-w-[85ch] align-top">
						<!-- Agent Reasoning View (V3) -->
						{#if agentEvents && agentEvents.length > 0}
							<div class="mb-2">
								<AgentReasoningView 
									events={agentEvents}
									isProcessing={false}
									hasContent={true}
								/>
							</div>
						{/if}

						<!-- Bubble -->
						<div
							class="rounded-lg border-0 px-2 text-gray-100 {isGrouped
								? 'rounded-tl-lg'
								: 'rounded-tl-sm'} backdrop-blur-sm"
						>
						<div
							id="message-content-{message.id}"
							class="[&>p:first-child]:!mt-0 prose prose-sm prose-invert max-w-full leading-relaxed break-words [&>*]:text-gray-100 [&_a:hover]:text-blue-300 [&_a]:text-blue-400 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-400/5 [&_blockquote]:p-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_hr]:block [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-slate-600/20 [&_code]:rounded [&_code]:border [&_code]:border-indigo-500/20 [&_code]:bg-indigo-500/15 [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:font-medium [&_code]:text-indigo-200 [&_em]:text-blue-300 [&_h1]:!text-white [&_h1:first-child]:mt-0 [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-xl [&_h2]:!text-white [&_h2:first-child]:mt-0 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h3]:!text-white [&_h3:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-2 [&_h3]:text-base [&_li]:my-1 [&_li]:text-gray-200 [&_ol]:my-3 [&_ol_li::marker]:text-gray-400 [&_p:last-child]:mb-0 [&_p]:mb-3 [&_p]:text-gray-100 [&_p]:leading-relaxed [&_p:not(:first-child)]:mt-2 [&_p:has(>strong:first-child)]:mt-6 [&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-indigo-500/20 [&_pre]:bg-slate-900/40 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre_code]:border-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-200 [&_strong]:text-white [&_table]:my-4 [&_table]:w-full [&_table]:overflow-x-auto [&_table]:rounded [&_td]:border-b [&_td]:border-slate-600/20 [&_td]:p-3 [&_td]:text-gray-200 [&_th]:border-b-2 [&_th]:border-indigo-500/30 [&_th]:bg-slate-700/50 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:text-white [&_tr:nth-child(even)]:bg-slate-700/20 [&_ul]:my-3 [&_ul_li::marker]:text-gray-400 [&_ul_ul]:mb-2 [&_ul_ul]:mt-2 [&_ul_ul]:rounded [&_ul_ul]:border [&_ul_ul]:border-slate-600/10 [&_ul_ul]:bg-slate-900/20 [&_ul_ul]:p-2 [&_ul_ul_li]:my-1 [&_ul_ul_li]:text-sm"
						>
							{@html messageContentHtml}
						</div>
						<div class="text-right">
							<span class="text-xs text-gray-500/70 font-medium">
								{formatMessageTime(getMessageCreatedAt(message) || '')}
							</span>
						</div>
					</div>
						<!-- Action Row: Feedback & Copy -->
						<div class="mt-1 flex items-start justify-between gap-4 min-h-[28px]">
							<!-- Left: Feedback (AI only) -->
							<div>
								{#if message.sender === 'ai'}
									<FeedbackWidget 
										conversationId={message.conversationId}
										messageId={message.id}
										toolsUsed={toolsUsed}
										responseTimeMs={responseTimeMs}
										className="mt-0"
									/>
								{/if}
							</div>

							<!-- Right: Copy Button -->
							<div class="flex justify-end opacity-0 translate-y-1 group-hover/ai:opacity-100 group-hover/ai:translate-y-0 transition-all duration-150 select-none">
								<button
									class="flex items-center rounded-md bg-white/5 p-1 text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
									onclick={async () => { await copyMessage(message.text); }}
									aria-label={copied ? 'Copied' : 'Copy message'}
								>
									{#if copied}
										<Icon name="check" className="text-emerald-300 text-xs" />
									{:else}
										<Icon name="content_copy" className="text-gray-300 text-xs" />
									{/if}
								</button>
							</div>
						</div>

						<!-- Sources section - only show if citations exist -->
						{#if message.sender === 'ai' && enhancedCitations && enhancedCitations.length > 0}
							<div class="mt-3">
								<button
									class="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-400 transition-colors mb-2"
									onclick={toggleSources}
									aria-expanded={showSources}
									aria-controls="sources-{message.id}"
								>
									<Icon
										name={showSources ? "expand_less" : "expand_more"}
										className="text-xs transition-transform duration-200"
									/>
									{enhancedCitations.length} Source{enhancedCitations.length === 1 ? '' : 's'}
								</button>
								
								<!-- Sources section - shown/hidden based on toggle -->
								<div
									id="sources-{message.id}"
									class="overflow-hidden transition-all duration-300 {showSources ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}"
								>
									<div class="border-t border-gray-800/50 pt-3">
										<CitationSources
											citations={enhancedCitations}
											messageId={message.id.toString()}
											on:citationClick={(e) => {
												const { citation, event } = e.detail;
												showCitationPopover(citation, event);
											}}
										/>
									</div>
								</div>
							</div>
						{/if}

						<!-- AI Metadata on hover - only show if at least one field has data -->
						{#if message.sender === 'ai'}
							<!-- Check both camelCase and snake_case field names -->
							{@const aiProvider = message.aiProvider || (message as any).ai_provider}
							{@const modelUsed = message.modelUsed || (message as any).model_used}
							{@const aiVersion = message.aiVersion || (message as any).ai_version}
							{@const dataSource = message.dataSource || (message as any).data_source}
							{@const processingTime = message.processingTime || (message as any).processing_time}
							{@const projectsFound =
								message.projectsFound !== undefined
									? message.projectsFound
									: (message as any).projects_found}
							{@const hasMetadata =
								aiProvider ||
								modelUsed ||
								dataSource ||
								processingTime ||
								(projectsFound !== null && projectsFound !== undefined)}

							{#if hasMetadata}
								<div
									class="pointer-events-none absolute bottom-full left-0 mb-2 opacity-0 transition-opacity duration-200 group-hover/ai:opacity-100"
								>
									<div
										class="min-w-64 rounded-lg border border-[#404040]/60 bg-[#1A1A1A]/80 p-3 shadow-xl backdrop-blur-md"
									>
										<div class="space-y-2 text-xs">
											<div class="mb-2 border-b border-[#404040]/40 pb-1 font-medium text-gray-200">
												AI Response Details
											</div>

											{#if aiProvider && modelUsed}
												<div class="flex items-center gap-2">
													<div class="h-1.5 w-1.5 rounded-full bg-green-500"></div>
													<span class="text-gray-200">{aiProvider} ({modelUsed})</span>
													{#if aiVersion}
														<span class="text-blue-400">• {aiVersion}</span>
													{/if}
												</div>
											{/if}

											{#if dataSource}
												<div class="flex items-center gap-2">
													<Icon name="storage" className="text-xs text-blue-400" />
													<span class="text-gray-200">Data: {dataSource}</span>
												</div>
											{/if}

											{#if processingTime}
												<div class="flex items-center gap-2">
													<Icon name="schedule" className="text-xs text-purple-400" />
													<span class="text-gray-200"
														>Time: {Number(processingTime).toFixed(2)}s</span
													>
												</div>
											{/if}

											{#if projectsFound !== null && projectsFound !== undefined}
												<div class="flex items-center gap-2">
													<Icon name="folder" className="text-xs text-emerald-400" />
													<span class="text-gray-200">Projects: {projectsFound}</span>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Follow-up suggestions - only show for AI messages that have suggestions -->
	{#if message.sender === 'ai' && message.follow_up_suggestions && message.follow_up_suggestions.length > 0}
		<div class="mt-3 ml-12 flex flex-wrap gap-2">
			{#each message.follow_up_suggestions as suggestion}
				<button
					class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-400/40 transition-colors duration-200"
					onclick={() => handleFollowUpClick(suggestion)}
				>
					<Icon name="lightbulb" className="text-xs text-blue-400" />
					<span>{suggestion}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Citation popover -->
{#if showPopover && currentCitation}
	<div
		class="fixed z-50 w-80 p-4 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-lg"
		style="left: {Math.min(popoverPosition.x, window.innerWidth - 320)}px; top: {Math.min(popoverPosition.y, window.innerHeight - 200)}px;"
	>
		<div class="flex items-start justify-between mb-2">
			<h3 class="text-sm font-medium text-gray-200">Source</h3>
			<button
				class="text-gray-500 hover:text-gray-300"
				onclick={closeCitationPopover}
				aria-label="Close citation"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
				</svg>
			</button>
		</div>
		
		<div class="space-y-3">
			<!-- Title with prominent relevance score -->
			<div class="flex items-start justify-between gap-2">
				<div class="flex-1">
					<h4 class="text-sm font-medium text-gray-300 mb-1">Source</h4>
					<p class="text-sm text-gray-100 leading-tight">
						{currentCitation.displayTitle || currentCitation.title}
					</p>
				</div>
				
				<!-- Prominent relevance score -->
				{#if currentCitation.relevancePercentage !== undefined}
					<div class="flex flex-col items-end gap-1 flex-shrink-0">
						<div class="text-lg font-bold {
							currentCitation.relevancePercentage >= 15 ? 'text-emerald-400' :
							currentCitation.relevancePercentage >= 10 ? 'text-blue-400' :
							currentCitation.relevancePercentage >= 5 ? 'text-yellow-400' :
							'text-gray-400'
						}">
							{currentCitation.relevancePercentage}%
						</div>
						<div class="text-xs text-gray-500">relevance</div>
					</div>
				{/if}
			</div>
			
			<!-- Snippet -->
			{#if currentCitation.snippet}
				<div>
					<h4 class="text-sm font-medium text-gray-300 mb-1">Content</h4>
					<p class="text-sm text-gray-400 italic leading-relaxed">
						"{currentCitation.snippet}"
					</p>
				</div>
			{/if}
			
			<!-- Metadata Grid -->
			{#if currentCitation.metadata}
				<div class="pt-2 border-t border-gray-700">
					<div class="grid grid-cols-2 gap-3 text-xs">
						<!-- Document Type -->
						{#if currentCitation.documentTypeDisplay}
							<div>
								<span class="font-medium text-gray-500">Document Type:</span>
								<div class="text-gray-400 mt-0.5">{currentCitation.documentTypeDisplay}</div>
							</div>
						{/if}
						
						<!-- Source Type (only show if not "intelligent_retrieval") -->
						{#if currentCitation.sourceTypeDisplay && currentCitation.sourceTypeDisplay.toLowerCase() !== 'intelligent retrieval'}
							<div>
								<span class="font-medium text-gray-500">Source Type:</span>
								<div class="text-gray-400 mt-0.5">{currentCitation.sourceTypeDisplay}</div>
							</div>
						{/if}
						
						<!-- Chunk ID -->
						{#if currentCitation.metadata.chunkId && currentCitation.metadata.chunkId !== '0'}
							<div>
								<span class="font-medium text-gray-500">Chunk ID:</span>
								<div class="text-gray-400 mt-0.5">{currentCitation.metadata.chunkId}</div>
							</div>
						{/if}
						
						<!-- Call ID -->
						{#if currentCitation.metadata.callId}
							<div>
								<span class="font-medium text-gray-500">Call ID:</span>
								<div class="text-gray-400 mt-0.5">{currentCitation.metadata.callId}</div>
							</div>
						{/if}
						
						<!-- Relevance Score with visual bar -->
						{#if currentCitation.relevancePercentage !== undefined}
							<div class="col-span-2">
								<span class="font-medium text-gray-500">Relevance Score:</span>
								<div class="flex items-center gap-3 mt-1">
									<div class="flex-1 bg-gray-700 rounded-full h-3">
										<div
											class="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
											style="width: {currentCitation.relevancePercentage}%"
										></div>
									</div>
									<span class="text-gray-400 font-medium">{currentCitation.relevancePercentage}%</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- View Source Link -->
			{#if currentCitation.url}
				<div class="pt-2 border-t border-gray-700">
					<a
						href={currentCitation.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
					>
						View Full Source
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
							<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
						</svg>
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
