<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getCurrentClient } from '$lib/clients/clientService';
  import { 
    proposalStore, 
    loadProposal, 
    currentSection,
    setActiveSection,
    getSection,
    updateSection
  } from '$lib/stores/proposalStore';
  import { streamingConversationStore } from '$lib/stores/streamingConversationStore';
  import { streamingClient } from '$lib/clients/streamingConversationClient';
  import { PROPOSAL_SECTIONS } from '$lib/types/proposal';
  import type { ProposalSection } from '$lib/types/proposal';
  import Icon from '$lib/components/generic/icon.svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  // Get proposal ID from URL params
  const proposalId = $derived(parseInt($page.params.proposal_id));
  const conversationId = $derived(proposalId); // Use same ID for conversation
  let userId = $state<string>('');
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let isMobileView = $state(false);
  let activeTab = $state<'chat' | 'document'>('chat');
  let previewContent = $state('');
  let isGeneratingContent = $state(false);
  let targetSectionId = $state<string>('');
  let userInput = $state('');

  // Subscribe to store values
  let proposal: any;
  let sections: ProposalSection[];
  let progress: any;
  let activeSectionId: string;
  let saving: boolean;
  let lastSaved: Date | null;

  proposalStore.subscribe(state => {
    proposal = state.proposal;
    sections = state.sections;
    progress = state.progress;
    activeSectionId = state.activeSection;
    saving = state.saving;
    lastSaved = state.lastSaved;
  });

  // Check for mobile view
  onMount(() => {
    const checkMobileView = () => {
      isMobileView = window.innerWidth < 768;
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  });

  // Load user info and proposal on mount
  onMount(async () => {
    try {
      const client = await getCurrentClient();
      if (!client) {
        error = 'User not authenticated';
        isLoading = false;
        return;
      }
      
      userId = client.id.toString();
      
      // Load proposal
      await loadProposal(proposalId);
      
      isLoading = false;
    } catch (err) {
      console.error('Error loading user or proposal:', err);
      error = 'Failed to load proposal';
      isLoading = false;
    }
  });

  // Set up conversation
  $effect(() => {
    if (conversationId) {
      streamingConversationStore.setConversation(conversationId);
      streamingConversationStore.loadExistingMessages(conversationId);
    }
  });

  // Handle navigation back to proposals list
  function handleBackToProposals() {
    goto('/dashboard/proposals');
  }

  function handleSectionClick(sectionId: string) {
    // Update the active section in the store
    setActiveSection(sectionId);
    
    // Log for debugging
    console.log('Section clicked:', sectionId);
    
    // Switch to document view on mobile
    if (isMobileView) {
      activeTab = 'document';
    }
  }

  function switchToTab(tab: 'chat' | 'document') {
    activeTab = tab;
  }

  function formatLastSaved(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  function getQualityScoreColor(score: number | null): string {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  }

  function getQualityScoreLabel(score: number | null): string {
    if (!score) return 'Not rated';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  }

  function calculateCategoryProgress(categorySections: ProposalSection[]): number {
    if (categorySections.length === 0) return 0;
    const completedSections = categorySections.filter(s => s.status === 'complete').length;
    return Math.round((completedSections / categorySections.length) * 100);
  }

  function isProposalEditingRequest(message: string): boolean {
    const proposalKeywords = [
      'write', 'draft', 'create', 'generate', 'improve', 'edit', 'modify',
      'section', 'proposal', 'objectives', 'methodology', 'impact', 'implementation',
      'add', 'remove', 'update', 'revise', 'enhance'
    ];
    
    const lowerMessage = message.toLowerCase();
    return proposalKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  function determineTargetSection(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit section mentions
    if (lowerMessage.includes('objectives')) return 'excellence.objectives';
    if (lowerMessage.includes('methodology')) return 'excellence.methodology';
    if (lowerMessage.includes('state of the art') || lowerMessage.includes('background')) return 'excellence.state_of_art';
    if (lowerMessage.includes('innovation')) return 'excellence.innovation';
    if (lowerMessage.includes('impact strategy') || lowerMessage.includes('impact')) return 'impact.impact_strategy';
    if (lowerMessage.includes('dissemination')) return 'impact.dissemination';
    if (lowerMessage.includes('communication')) return 'impact.communication';
    if (lowerMessage.includes('exploitation')) return 'impact.exploitation';
    if (lowerMessage.includes('work plan') || lowerMessage.includes('workplan')) return 'implementation.work_plan';
    if (lowerMessage.includes('consortium')) return 'implementation.consortium';
    if (lowerMessage.includes('resources')) return 'implementation.resources';
    if (lowerMessage.includes('risk management') || lowerMessage.includes('risks')) return 'implementation.risk_management';
    
    // Default to current active section
    return activeSectionId;
  }

  async function handleSendMessage() {
    if (!userInput.trim() || $streamingConversationStore.isProcessing) return;
    
    // Store the current input before clearing it
    const currentInput = userInput;
    
    // Add user message
    streamingConversationStore.addUserMessage(currentInput);
    
    // Start AI response
    const aiMessageId = streamingConversationStore.startAIResponse();
    
    // Check if this is a proposal editing request
    const isProposalEdit = isProposalEditingRequest(currentInput);
    
    if (isProposalEdit) {
      isGeneratingContent = true;
      targetSectionId = determineTargetSection(currentInput);
      previewContent = '';
    }
    
    // Clear the input field
    userInput = '';
    
    // Send streaming request
    await streamingClient.sendStreamingMessage(
      conversationId,
      currentInput,
      true, // include context
      
      // onProgress
      (stage: string, message: string, extras?: any) => {
        streamingConversationStore.updateStage({
          stage,
          message,
          timestamp: new Date().toISOString(),
          routingDecision: extras?.routingDecision,
          intentConfidence: extras?.intentConfidence
        });
      },
      
      // onToken
      (content: string) => {
        streamingConversationStore.appendToAIMessage(aiMessageId, content);
        
        // If this is a proposal edit, accumulate preview content
        if (isGeneratingContent) {
          previewContent += content;
        }
      },
      
      // onComplete
      async (metadata: any) => {
        streamingConversationStore.completeAIMessage(aiMessageId, metadata);
        
        // If this was a proposal edit, save the content
        if (isGeneratingContent && previewContent && targetSectionId) {
          await saveGeneratedContent(targetSectionId, previewContent);
        }
        
        isGeneratingContent = false;
        previewContent = '';
        targetSectionId = '';
      },
      
      // onError
      (error: string) => {
        streamingConversationStore.setError(error);
        isGeneratingContent = false;
        previewContent = '';
        targetSectionId = '';
      }
    );
  }

  async function saveGeneratedContent(sectionId: string, content: string) {
    try {
      await updateSection(sectionId, content);
      
      // Show success message in the current stage
      streamingConversationStore.updateStage({
        stage: 'content_saved',
        message: `✅ Content saved to ${getSection(sectionId)?.section_name || 'section'}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving generated content:', error);
      streamingConversationStore.updateStage({
        stage: 'save_error',
        message: '❌ Failed to save content. Please try again.',
        timestamp: new Date().toISOString()
      });
    }
  }

  function handleStopGeneration() {
    streamingClient.closeConnection();
    streamingConversationStore.setError('Generation stopped by user');
    isGeneratingContent = false;
    previewContent = '';
    targetSectionId = '';
  }

  // Function to safely render markdown (same as in streaming-message.svelte)
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
  <div class="relative z-30 border-b border-[#3A3A3A] bg-[#1E1E1E]/70 backdrop-blur-md px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="flex items-center justify-center w-8 h-8 rounded-full bg-[#2C2C2C] hover:bg-[#4F4F4F] transition-colors"
          onclick={handleBackToProposals}
          title="Back to proposals"
        >
          <Icon name="arrow_back" className="text-[#E0E0E0] text-sm" />
        </button>
        <h1 class="text-xl font-semibold text-[#E0E0E0]">Proposal Editor</h1>
        {#if proposal}
          <span class="text-sm text-[#B0B0B0]">
            {proposal.call_id}
          </span>
        {/if}
      </div>
      
      <!-- Mobile tab switcher -->
      {#if isMobileView}
        <div class="flex bg-[#2C2C2C] rounded-lg p-1">
          <button
            class="px-3 py-1 rounded text-sm font-medium transition-colors {
              activeTab === 'chat' 
                ? 'bg-[#8A2BE2] text-white' 
                : 'text-[#B0B0B0] hover:text-white'
            }"
            onclick={() => switchToTab('chat')}
          >
            Chat
          </button>
          <button
            class="px-3 py-1 rounded text-sm font-medium transition-colors {
              activeTab === 'document' 
                ? 'bg-[#8A2BE2] text-white' 
                : 'text-[#B0B0B0] hover:text-white'
            }"
            onclick={() => switchToTab('document')}
          >
            Document
          </button>
        </div>
      {/if}
      
      <!-- Status indicators -->
      <div class="flex items-center gap-4 text-sm">
        {#if saving}
          <div class="flex items-center gap-2 text-yellow-400">
            <div class="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </div>
        {:else if lastSaved}
          <div class="flex items-center gap-2 text-[#B0B0B0]">
            <Icon name="check_circle" className="text-green-500" />
            <span>Saved {formatLastSaved(lastSaved)}</span>
          </div>
        {/if}
        
        {#if progress}
          <div class="flex items-center gap-2">
            <span class="text-[#B0B0B0]">{progress.completion_percentage}%</span>
            <div class="w-24 bg-[#2C2C2C] rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-[#8A2BE2] to-[#A052E8] h-2 rounded-full transition-all duration-300"
                style="width: {progress.completion_percentage}%"
              ></div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main content area - Fixed height with proper overflow handling -->
  <div class="relative z-10 flex h-full w-full flex-1 overflow-hidden {isMobileView ? 'flex-col' : 'flex'}">
    <!-- Chat Panel -->
    <div class="{isMobileView ? (activeTab === 'chat' ? 'flex' : 'hidden') : 'flex'} {isMobileView ? 'h-full' : 'w-2/5'} flex flex-col border-r border-[#3A3A3A] bg-[#1E1E1E]/30">
      <!-- Section Navigation - Fixed height -->
      <div class="p-4 border-b border-[#3A3A3A] bg-[#1E1E1E]/50 max-h-48 overflow-y-auto">
        <h3 class="text-sm font-semibold text-[#B0B0B0] mb-3">Proposal Sections</h3>
        <div class="space-y-2">
          {#each Object.entries(PROPOSAL_SECTIONS) as [categoryKey, categoryData]}
            {@const categorySections = sections.filter(s => s.section_id.startsWith(`${categoryKey}.`))}
            {@const categoryProgress = calculateCategoryProgress(categorySections)}
            
            <div class="space-y-2">
              <div class="flex items-center justify-between px-2 py-1">
                <h4 class="text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide">
                  {categoryData.name}
                </h4>
                <span class="text-xs text-[#B0B0B0]">
                  {categoryProgress}%
                </span>
              </div>
              
              <div class="w-full bg-[#2C2C2C] rounded-full h-1 mb-2">
                <div 
                  class="bg-gradient-to-r from-[#8A2BE2] to-[#A052E8] h-1 rounded-full transition-all duration-300"
                  style="width: {categoryProgress}%"
                ></div>
              </div>
              
              <div class="space-y-1 ml-2">
                {#each Object.entries(categoryData.subsections) as [subsectionKey, subsectionName]}
                  {@const sectionId = `${categoryKey}.${subsectionKey}`}
                  {@const section = sections.find(s => s.section_id === sectionId)}
                  {#if section}
                    <button
                      class="flex items-center gap-2 w-full px-3 py-2 bg-[#2C2C2C]/50 hover:bg-[#4F4F4F]/50 rounded-md transition-colors text-left {
                        activeSectionId === sectionId ? 'bg-[#8A2BE2]/20 border-l-2 border-[#8A2BE2]' : ''
                      }"
                      onclick={() => handleSectionClick(sectionId)}
                    >
                      <!-- Status icon -->
                      <span class="text-xs {
                        section.status === 'complete' ? 'text-green-500' : 
                        section.status === 'draft' ? 'text-yellow-500' : 
                        'text-gray-500'
                      }">
                        {section.status === 'complete' ? '✓' : 
                         section.status === 'draft' ? '⏳' : '⭕'}
                      </span>
                      
                      <!-- Section name -->
                      <span class="flex-1 text-xs text-[#E0E0E0]">
                        {subsectionName}
                      </span>
                      
                      <!-- Word count -->
                      <span class="text-xs text-[#B0B0B0] font-mono">
                        [{section.word_count}w]
                      </span>
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Chat Messages - Flexible height with overflow -->
      <div class="flex-1 overflow-y-auto p-4">
        {#each $streamingConversationStore.messages as message (message.id)}
          <div class="mb-4">
            <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
              <div class="max-w-[80%] bg-[#2C2C2C] rounded-lg p-3">
                {#if message.sender === 'ai'}
                  <div class="text-sm text-[#E0E0E0] prose prose-invert max-w-none">
                    {@html renderMarkdown(message.text)}
                  </div>
                {:else}
                  <div class="text-sm text-[#E0E0E0] whitespace-pre-wrap">{message.text}</div>
                {/if}
                
                <!-- Show content preview when generating proposal content -->
                {#if isGeneratingContent && message.sender === 'ai' && previewContent}
                  <div class="mt-2 p-3 bg-[#8A2BE2]/10 border border-[#8A2BE2]/30 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-[#BB86FC]">
                        Preview: {getSection(targetSectionId)?.section_name || 'Section'}
                      </span>
                      <button
                        class="text-xs text-red-400 hover:text-red-300"
                        onclick={handleStopGeneration}
                      >
                        <Icon name="close" className="w-3 h-3" />
                      </button>
                    </div>
                    <div class="text-sm text-[#E0E0E0] prose prose-invert max-w-none">
                      {@html renderMarkdown(previewContent)}
                    </div>
                    {#if isGeneratingContent}
                      <div class="flex items-center gap-2 mt-2">
                        <div class="w-2 h-2 bg-[#8A2BE2] rounded-full animate-pulse"></div>
                        <span class="text-xs text-[#BB86FC]">Generating...</span>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        <!-- Processing stage indicator -->
        {#if $streamingConversationStore.currentStage}
          <div class="mb-4">
            <div class="flex justify-center">
              <div class="bg-[#2C2C2C] rounded-lg px-4 py-2">
                <div class="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <div class="w-2 h-2 bg-[#8A2BE2] rounded-full animate-pulse"></div>
                  <span>{$streamingConversationStore.currentStage.message}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Chat Input - Fixed at bottom -->
      <div class="p-4 border-t border-[#3A3A3A] bg-[#1E1E1E]/50">
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={userInput}
            onkeypress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me to write or improve any section..."
            disabled={$streamingConversationStore.isProcessing}
            class="flex-1 px-3 py-2 bg-[#2C2C2C] border border-[#4F4F4F] rounded-lg text-[#E0E0E0] placeholder-[#B0B0B0] focus:outline-none focus:border-[#8A2BE2] disabled:opacity-50"
          />
          <button 
            onclick={handleSendMessage}
            disabled={$streamingConversationStore.isProcessing}
            class="px-4 py-2 bg-[#8A2BE2] text-white rounded-lg hover:bg-[#A052E8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {#if $streamingConversationStore.isProcessing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {:else}
              <Icon name="send" />
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Document Panel -->
    <div class="{isMobileView ? (activeTab === 'document' ? 'flex' : 'hidden') : 'flex'} {isMobileView ? 'h-full' : 'w-3/5'} flex flex-col bg-[#121212]">
      {#if isLoading}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 border-4 border-[#8A2BE2] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-[#B0B0B0]">Loading proposal...</p>
          </div>
        </div>
      {:else if $currentSection}
        <!-- Force re-render with a block that has the active section ID -->
        {#key activeSectionId}
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Debug Info -->
            <div class="mb-4 p-2 bg-purple-900/20 border border-purple-700/30 rounded text-xs text-purple-300">
              Debug: Active Section ID = {activeSectionId} | Section Name = {$currentSection?.section_name}
            </div>
            
            <!-- Section Header -->
            <div class="mb-6 pb-4 border-b border-[#3A3A3A]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 bg-[#8A2BE2] rounded-full animate-pulse"></div>
                  <h1 class="text-2xl font-bold text-[#E0E0E0] mb-2">
                    {$currentSection?.section_name}
                  </h1>
                </div>
                <div class="flex items-center gap-4 text-sm">
                  <!-- Quality Score -->
                  <div class="flex items-center gap-2">
                    <span class="text-[#B0B0B0]">Quality:</span>
                    <span class="{getQualityScoreColor($currentSection?.quality_score)} font-medium">
                      {getQualityScoreLabel($currentSection?.quality_score)}
                    </span>
                  </div>
                  
                  <!-- Word Count -->
                  <div class="flex items-center gap-2 text-[#B0B0B0]">
                    <Icon name="text_fields" />
                    <span>{$currentSection?.word_count} words</span>
                  </div>
                  
                  <!-- Status -->
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-full text-xs font-medium 
                      {$currentSection?.status === 'complete' ? 'bg-green-900/50 text-green-400' : ''}
                      {$currentSection?.status === 'draft' ? 'bg-yellow-900/50 text-yellow-400' : ''}
                      {$currentSection?.status === 'empty' ? 'bg-gray-800 text-gray-500' : ''}
                    ">
                      {$currentSection?.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <p class="text-sm text-[#B0B0B0]">
                Last updated: {new Date($currentSection?.last_updated || '').toLocaleString()}
              </p>
            </div>

            <!-- Section Content -->
            <div class="prose prose-invert max-w-none">
              {#if $currentSection?.content}
                <div class="bg-[#1E1E1E]/50 rounded-lg p-6 border border-[#3A3A3A]">
                  {@html renderMarkdown($currentSection.content)}
                </div>
              {:else}
                <div class="bg-[#1E1E1E]/30 rounded-lg p-12 border-2 border-dashed border-[#3A3A3A] text-center">
                  <Icon name="description" className="text-4xl text-[#757575] mb-4" />
                  <h3 class="text-lg font-medium text-[#B0B0B0] mb-2">No content yet</h3>
                  <p class="text-[#B0B0B0]">Use the chat interface to start writing this section.</p>
                </div>
              {/if}
            </div>
          </div>
        {/key}
      {:else}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <Icon name="description" className="text-4xl text-[#757575]" />
            <p class="text-[#B0B0B0]">Select a section to view its content</p>
          </div>
        </div>
      {/if}
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
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background-color: rgba(64, 64, 64, 0.4);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(80, 80, 80, 0.7);
  }

  /* Custom prose styles for dark theme */
  :global(.prose-invert) {
    color: #e5e7eb;
  }
  
  :global(.prose-invert h1) {
    color: #f9fafb;
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert h2) {
    color: #f9fafb;
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert h3) {
    color: #f9fafb;
  }
  
  :global(.prose-invert p) {
    color: #d1d5db;
  }
  
  :global(.prose-invert strong) {
    color: #f9fafb;
  }
  
  :global(.prose-invert blockquote) {
    border-left-color: #8b5cf6;
    background-color: rgba(139, 92, 246, 0.1);
    color: #e5e7eb;
  }
  
  :global(.prose-invert code) {
    background-color: #374151;
    color: #f9fafb;
  }
  
  :global(.prose-invert pre) {
    background-color: #1f2937;
    color: #e5e7eb;
  }
  
  :global(.prose-invert a) {
    color: #8b5cf6;
  }
  
  :global(.prose-invert a:hover) {
    color: #a78bfa;
  }
  
  :global(.prose-invert ul > li::marker) {
    color: #9ca3af;
  }
  
  :global(.prose-invert ol > li::marker) {
    color: #9ca3af;
  }
  
  :global(.prose-invert table) {
    border-color: #374151;
  }
  
  :global(.prose-invert thead) {
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert tbody tr) {
    border-bottom-color: #374151;
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