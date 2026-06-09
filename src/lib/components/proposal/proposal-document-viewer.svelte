<script lang="ts">
  import { 
    proposalSessionStore, 
    activeSection 
  } from '$lib/stores/proposalSessionStore';
  import type { SessionSection } from '$lib/types/proposal-session';
  import SectionNavItem from './section-nav-item.svelte';
  import Icon from '$lib/components/generic/icon.svelte';
  import { renderMarkdown } from '$lib/utils/markdownRenderer';

  // Derived store values
  let storeState: any;
  let sections: Record<string, SessionSection> = {};
  let progress = { completion_percentage: 0, total_words: 0, completed_sections: 0, total_sections: 0, estimated_pages: 0 };
  let loading = false;
  let currentSectionData: SessionSection | null = null;
  let isEditing = false;
  let editContent = '';
  let dynamicCategories: any[] = [];

  // Subscribe to the whole store to react to changes
  proposalSessionStore.subscribe(state => {
    storeState = state;
    sections = state.sections;
    progress = {
      completion_percentage: state.completionPercentage,
      total_words: state.totalWords,
      completed_sections: Object.values(state.sections).filter(s => s.status === 'complete').length,
      total_sections: Object.keys(state.sections).length,
      estimated_pages: Math.ceil(state.totalWords / 500) // Rough estimate
    };
    loading = state.loading;

    // Calculate dynamic categories from sections
    const cats: Record<string, { name: string, key: string, sections: SessionSection[] }> = {};
    for (const section of Object.values(sections)) {
      const parts = section.section_id.split('.');
      const categoryKey = parts[0] || 'other';
      if (!cats[categoryKey]) {
        const displayName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        cats[categoryKey] = { name: displayName, key: categoryKey, sections: [] };
      }
      cats[categoryKey].sections.push(section);
    }
    const order = ['excellence', 'impact', 'implementation', 'pi'];
    dynamicCategories = Object.values(cats).sort((a, b) => {
      const indexA = order.indexOf(a.key);
      const indexB = order.indexOf(b.key);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  activeSection.subscribe(value => {
    currentSectionData = value;
    if (value) {
        // Reset edit mode when section changes
        isEditing = false;
        editContent = value.content;
    }
  });

  function handleSectionClick(event: CustomEvent) {
    proposalSessionStore.setActiveSection(event.detail.sectionId);
  }

  function toggleEdit() {
    if (!currentSectionData) return;
    if (isEditing) {
      // Save
      proposalSessionStore.updateSectionContent(currentSectionData.section_id, editContent);
      isEditing = false;
    } else {
      // Start Editing
      editContent = currentSectionData.content;
      isEditing = true;
    }
  }

  function cancelEdit() {
    if (!currentSectionData) return;
    editContent = currentSectionData.content;
    isEditing = false;
  }

  async function handleEvaluate() {
    if (!currentSectionData) return;
    await proposalSessionStore.evaluateSection(currentSectionData.section_id);
  }

  // Calculate category completion
  function calculateCategoryProgress(categorySections: SessionSection[]): number {
    if (categorySections.length === 0) return 0;
    const completedSections = categorySections.filter(s => s.status === 'complete').length;
    return Math.round((completedSections / categorySections.length) * 100);
  }

  function getQualityScoreColor(score: number | null): string {
    if (!score) return 'text-[#6B7280]';
    if (score >= 4.0) return 'text-[#4CAF50]'; 
    if (score >= 2.5) return 'text-[#FFC107]';
    return 'text-[#F44336]';
  }

  function getQualityScoreLabel(score: number | null): string {
    if (!score) return 'Not rated';
    if (score >= 4.0) return 'High';
    if (score >= 2.5) return 'Medium';
    return 'Low';
  }
</script>

<div class="proposal-viewer h-full flex flex-col bg-transparent text-[#F5F5F5]">
  <!-- Header with title and progress -->
  <div class="border-b border-[#40404033] px-5 py-3 bg-[#1E1E1E]/30 backdrop-blur-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <h2 class="text-base md:text-lg font-semibold text-[#F5F5F5] tracking-tight truncate max-w-md xl:max-w-xl">
        {storeState?.title || 'Untitled Proposal'}
      </h2>
      {#if storeState?.proposalType}
      <a 
          href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/how-to-participate/reference-documents" 
          target="_blank" 
          rel="noopener noreferrer"
          class="px-3 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-[#3B82F6]/50 text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-colors shrink-0 flex items-center gap-1"
          title="View official EU templates for {storeState.proposalType}"
      >
          <Icon name="article" className="w-2 -pt-2 pr-1" />
          {storeState.proposalType}
      </a>
      {/if}
      <button 
          class="ml-2 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#40404033] rounded flex items-center gap-2 text-xs font-medium text-[#E5E7EB] transition-colors shadow-sm whitespace-nowrap shrink-0"
          onclick={() => window.open(`http://localhost:8000/api/proposal/export/${storeState?.proposalId}/complete-package`, '_blank')}
          title="Export as complete submission package (ZIP with Word and Excel)"
          disabled={!storeState?.proposalId}
      >
          <Icon name="download" className="w-3.5 h-3.5" />
          Export
      </button>
      {#if loading}
           <div class="flex items-center gap-2 text-[#FFC107] bg-[#FFC107]/10 px-2 py-1 rounded text-xs">
              <div class="w-3 h-3 border-2 border-[#FFC107] border-t-transparent rounded-full animate-spin"></div>
              <span>Syncing</span>
           </div>
      {/if}
    </div>
    
    <!-- Progress bar -->
    <div class="w-full xl:w-72 space-y-1.5 shrink-0">
      <div class="flex justify-between text-xs font-medium">
          <span class="text-[#B0B0B0]">Progress</span>
          <span class="text-[#F5F5F5]">{progress.completion_percentage.toFixed(0)}%</span>
      </div>
      <div class="w-full bg-[#2A2A2A] rounded-full h-1.5 overflow-hidden shadow-inner">
          <div 
          class="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style="width: {progress.completion_percentage}%"
          ></div>
      </div>
      <div class="flex justify-between text-[10px] text-[#6B7280]">
          <span>{progress.completed_sections} / {progress.total_sections} sections</span>
          <span>{progress.total_words} words</span>
      </div>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden min-h-0">
    <!-- Navigation Sidebar -->
    <div class="w-64 border-r border-[#40404033] bg-[#1A1A1A]/30 overflow-y-auto">
      <div class="p-3 space-y-4">
        {#each dynamicCategories as category}
          {@const categoryProgress = calculateCategoryProgress(category.sections)}
          
          <div class="space-y-3">
            <div class="flex items-center justify-between px-3">
              <h3 class="text-xs font-bold text-[#B0B0B0] uppercase tracking-wider">
                {category.name}
              </h3>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2A2A2A] text-[#B0B0B0]">
                {categoryProgress}%
              </span>
            </div>
            
            <div class="w-full bg-[#2A2A2A] rounded-full h-1 mb-2 mx-3 w-[calc(100%-1.5rem)]">
              <div 
                class="bg-[#3B82F6] h-1 rounded-full transition-all duration-300 opacity-80"
                style="width: {categoryProgress}%"
              ></div>
            </div>
            
            <div class="space-y-1">
              {#each category.sections as section}
                <SectionNavItem 
                  {section}
                  active={currentSectionData?.section_id === section.section_id}
                  level={2}
                  on:click={handleSectionClick}
                />
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Section Content -->
    <div class="flex-1 overflow-y-auto bg-transparent relative min-h-0 min-w-0">
      {#if loading && !currentSectionData}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-[#B0B0B0]">Loading proposal...</p>
          </div>
        </div>
      {:else if currentSectionData}
        <div id="section-{currentSectionData.section_id}" class="p-6 max-w-4xl mx-auto">
          <!-- Section Header -->
          <div class="mb-6 pb-4 border-b border-[#40404033]">
            <div class="flex items-center justify-between mb-3">
              <h1 class="text-2xl font-bold text-[#F5F5F5] tracking-tight">
                {currentSectionData.section_name}
              </h1>
              
              <!-- Status Badges -->
              <div class="flex items-center gap-2">
                 {#if currentSectionData.lock_status !== 'unlocked'}
                     <div class="flex items-center gap-2 px-3 py-1 bg-[#FFC107]/10 border border-[#FFC107]/30 rounded-full text-[#FFC107] text-xs font-medium animate-pulse">
                        <Icon name="lock" className="w-3 h-3" />
                        <span>GENERATING</span>
                     </div>
                {/if}
                
                <span class="px-3 py-1 rounded-full text-xs font-medium border
                  {currentSectionData.status === 'complete' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]' : ''}
                  {currentSectionData.status === 'draft' ? 'bg-[#FFC107]/10 border-[#FFC107]/30 text-[#FFC107]' : ''}
                  {currentSectionData.status === 'empty' ? 'bg-[#2A2A2A] border-[#4F4F4F] text-[#B0B0B0]' : ''}
                ">
                  {currentSectionData.status.toUpperCase()}
                </span>
              </div>
            </div>

            <!-- Metadata Bar -->
            <div class="flex items-center justify-between text-xs bg-[#1E1E1E] p-3 rounded-xl border border-[#4F4F4F]">
                <!-- Quality Score -->
                <div class="flex items-center gap-3">
                  <div class="flex flex-col">
                    <span class="text-[10px] uppercase text-[#6B7280] font-bold tracking-wider">Quality Score</span>
                    <div class="flex items-center gap-2">
                        <span class="{getQualityScoreColor(currentSectionData.quality_score)} font-bold text-lg">
                            {currentSectionData.quality_score ? currentSectionData.quality_score.toFixed(1) : '-'}
                        </span>
                        <span class="text-[#B0B0B0] text-xs">/ 5.0</span>
                        <span class="text-[#6B7280] text-xs ml-1">({getQualityScoreLabel(currentSectionData.quality_score)})</span>
                    </div>
                  </div>
                </div>
                
                <div class="w-px h-8 bg-[#4F4F4F]"></div>

                <!-- Word Count -->
                <div class="flex items-center gap-3">
                   <div class="flex flex-col">
                    <span class="text-[10px] uppercase text-[#6B7280] font-bold tracking-wider">Word Count</span>
                    <div class="flex items-center gap-2 text-[#F5F5F5]">
                        <Icon name="text_fields" className="text-[#3B82F6]" />
                        <span class="font-medium">{currentSectionData.word_count} words</span>
                    </div>
                  </div>
                </div>

                <div class="w-px h-8 bg-[#4F4F4F]"></div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <button 
                        class="px-3 py-2 {currentSectionData.status === 'complete' ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/20' : 'bg-[#2A2A2A] text-[#B0B0B0] border-[#4F4F4F] hover:bg-[#333333] hover:text-white'} rounded-lg text-xs transition-colors border"
                        onclick={() => proposalSessionStore.updateSectionStatus(currentSectionData.section_id, currentSectionData.status === 'complete' ? 'draft' : 'complete')}
                        disabled={currentSectionData.lock_status !== 'unlocked'}
                        title={currentSectionData.status === 'complete' ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                        <div class="flex items-center gap-1.5">
                            {#if currentSectionData.status === 'complete'}
                                <Icon name="check_circle" className="size-3 -mt-3" />
                                <span>Done</span>
                            {:else}
                                <Icon name="radio_button_unchecked" className="size-3 -mt-3" />
                                <span>Mark Done</span>
                            {/if}
                        </div>
                    </button>
                    <button 
                        class="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333333] rounded-lg text-xs text-[#B0B0B0] hover:text-white transition-colors border border-[#4F4F4F]"
                        onclick={toggleEdit}
                        disabled={currentSectionData.lock_status !== 'unlocked'}
                    >
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
                    {#if isEditing}
                        <button 
                            class="px-3 py-2 bg-transparent hover:bg-[#2A2A2A] rounded-lg text-xs text-[#F44336] transition-colors"
                            onclick={cancelEdit}
                        >
                            Cancel
                        </button>
                    {/if}
                    <button 
                        class="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg text-xs text-white transition-colors shadow-lg shadow-blue-900/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={handleEvaluate}
                        disabled={!currentSectionData.content || currentSectionData.lock_status !== 'unlocked'}
                    >
                        Evaluate
                    </button>
                </div>
            </div>
          </div>

          <!-- Section Content -->
          <div class="prose prose-sm prose-invert max-w-none">
            {#if isEditing}
                <textarea 
                    bind:value={editContent} 
                    class="w-full h-[500px] bg-[#1A1A1A] text-[#E5E7EB] p-5 rounded-xl font-mono text-xs border border-[#4F4F4F] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] leading-relaxed resize-none shadow-inner"
                    placeholder="Start typing..."
                ></textarea>
            {:else if currentSectionData.content}
              <div class="bg-[#1E1E1E] rounded-xl p-8 border border-[#4F4F4F] shadow-sm min-h-[300px]">
                {@html renderMarkdown(currentSectionData.content)}
              </div>
            {:else}
              <div class="bg-[#1E1E1E]/30 rounded-xl p-16 border-2 border-dashed border-[#4F4F4F] text-center flex flex-col items-center">
                <div class="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4">
                    <Icon name="description" className="text-3xl text-[#6B7280]" />
                </div>
                <h3 class="text-lg font-medium text-[#F5F5F5] mb-2">No content yet</h3>
                <p class="text-[#B0B0B0] max-w-sm">Use the chat interface to ask the AI to draft this section based on the call requirements.</p>
                <div class="mt-6 flex gap-3">
                     <span class="px-3 py-1 bg-[#2A2A2A] rounded text-xs text-[#6B7280] font-mono">"Write the objectives..."</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
             <div class="w-20 h-20 bg-[#1E1E1E] rounded-full flex items-center justify-center mx-auto border border-[#4F4F4F]">
                <Icon name="description" className="text-4xl text-[#3B82F6]" />
             </div>
            <h3 class="text-xl font-medium text-[#F5F5F5]">Select a Section</h3>
            <p class="text-[#B0B0B0]">Choose a section from the sidebar to view or edit.</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Custom prose styles for dark theme to match Design.json */
  :global(.prose-invert) {
    color: #E5E7EB;
  }
  
  :global(.prose-invert h1) {
    color: #F5F5F5;
    font-weight: 700;
  }
  
  :global(.prose-invert h2) {
    color: #F5F5F5;
    font-weight: 600;
    margin-top: 2em;
    border-bottom: 1px solid #40404033;
    padding-bottom: 0.5em;
  }
  
  :global(.prose-invert h3) {
    color: #E5E7EB;
    font-weight: 600;
  }
  
  :global(.prose-invert p) {
    color: #D1D5DB;
    line-height: 1.75;
  }
  
  :global(.prose-invert strong) {
    color: #F5F5F5;
  }
  
  :global(.prose-invert blockquote) {
    border-left-color: #3B82F6;
    background-color: rgba(59, 130, 246, 0.1);
    color: #E5E7EB;
    padding: 1rem;
    border-radius: 0 0.5rem 0.5rem 0;
  }
  
  :global(.prose-invert code) {
    background-color: #2A2A2A;
    color: #93C5FD;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  :global(.prose-invert pre) {
    background-color: #1A1A1A;
    border: 1px solid #4F4F4F;
  }
  
  :global(.prose-invert a) {
    color: #3B82F6;
    text-decoration: none;
    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  }
  
  :global(.prose-invert a:hover) {
    color: #60A5FA;
    border-bottom-color: #60A5FA;
  }
  
  :global(.prose-invert ul > li::marker) {
    color: #6B7280;
  }
</style>