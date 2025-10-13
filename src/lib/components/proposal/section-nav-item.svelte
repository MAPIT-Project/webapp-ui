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
  $: statusColorClass = getStatusColor(section.status);
  $: statusIcon = getStatusIcon(section.status);
</script>

<div 
  class="nav-item {active ? 'active' : ''} hover:bg-gray-800 cursor-pointer transition-colors duration-200"
  style={indentStyle}
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
  <div class="flex items-center gap-2 py-2 px-3">
    <!-- Status icon -->
    <span class="{statusColorClass} text-sm font-medium">
      {statusIcon}
    </span>
    
    <!-- Section name -->
    <span class="flex-1 text-sm text-gray-300 {active ? 'text-white font-medium' : ''}">
      {section.section_name}
    </span>
    
    <!-- Word count -->
    <span class="text-xs text-gray-500 font-mono">
      [{formatWordCount(section.word_count)}]
    </span>
  </div>
</div>

<style>
  .nav-item {
    border-radius: 4px;
    margin: 1px 0;
  }
  
  .nav-item.active {
    background-color: rgba(139, 92, 246, 0.2); /* Purple with opacity */
    border-left: 3px solid #8b5cf6; /* Purple */
  }
  
  .nav-item:hover {
    background-color: rgba(55, 65, 81, 0.5); /* Gray with opacity */
  }
  
  .nav-item:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
</style>