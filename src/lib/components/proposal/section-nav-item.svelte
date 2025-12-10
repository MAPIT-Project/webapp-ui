<script lang="ts">
  import type { ProposalSection } from '$lib/types/proposal';
  import { getSectionName, getStatusIcon, getStatusColor } from '$lib/types/proposal';
  import { createEventDispatcher } from 'svelte';

  export let section: ProposalSection;
  export let active: boolean = false;
  export let level: number = 1; // 1 for main section, 2 for subsection
  export let indentation: number = 0; // Custom indentation level

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click', { sectionId: section.section_id });
  }

  function formatWordCount(count: number): string {
    return `${count}w`;
  }

  // Calculate indentation based on level and custom indentation
  $: indentStyle = `padding-left: ${(level * 16 + indentation * 8)}px`;
  
  // Custom status colors mapping to Design.json
  $: statusColorClass = getStatusColorClass(section.status);
  $: statusIcon = getStatusIcon(section.status);

  function getStatusColorClass(status: string) {
      switch(status) {
          case 'complete': return 'text-[#4CAF50]';
          case 'draft': return 'text-[#FFC107]';
          default: return 'text-[#6B7280]';
      }
  }
</script>

<div 
  class="nav-item {active ? 'active' : ''} hover:bg-[#2A2A2A] cursor-pointer transition-all duration-200 group"
  style={indentStyle}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
  <div class="flex items-center gap-2 py-2.5 px-3">
    <!-- Status icon -->
    <span class="{statusColorClass} text-xs transition-transform group-hover:scale-110">
      {statusIcon}
    </span>
    
    <!-- Section name -->
    <span class="flex-1 text-xs tracking-wide {active ? 'text-white font-semibold' : 'text-[#B0B0B0] group-hover:text-[#F5F5F5]'} transition-colors truncate">
      {section.section_name}
    </span>
    
    <!-- Word count -->
    <span class="text-[10px] {active ? 'text-[#93C5FD]' : 'text-[#6B7280]'} font-mono opacity-80">
      {formatWordCount(section.word_count)}
    </span>
  </div>
</div>

<style>
  .nav-item {
    border-radius: 6px;
    margin: 2px 0;
    border-left: 2px solid transparent;
  }
  
  .nav-item.active {
    background-color: rgba(59, 130, 246, 0.1); /* Blue with opacity */
    border-left-color: #3B82F6; /* Blue */
  }
  
  .nav-item:focus {
    outline: none;
    background-color: rgba(59, 130, 246, 0.05);
  }
</style>