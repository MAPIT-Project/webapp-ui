<script lang="ts">
  import { slide } from 'svelte/transition';
  import { afterUpdate } from 'svelte';
  import type { StreamingEventData } from '$lib/clients/streamingConversationClient';
  import { TOOL_DISPLAY_CONFIG } from '$lib/config/toolDisplayConfig';
  import BudgetCalculationResult from '$lib/components/tools/budget-calculation-result.svelte';
  import TimelineResult from '$lib/components/tools/timeline-result.svelte';

  export let events: StreamingEventData[] = [];
  export let isProcessing: boolean = false;
  export let hasContent: boolean = false;

  let expanded = true;
  let containerRef: HTMLElement;
  
  // Auto-collapse when content starts appearing
  $: if (hasContent) {
    expanded = false;
  }

  // Auto-scroll to bottom when new events arrive
  afterUpdate(() => {
    if (expanded && containerRef) {
      containerRef.scrollTo({ top: containerRef.scrollHeight, behavior: 'smooth' });
    }
  });

  function getIcon(type: string) {
    switch (type) {
      case 'agent_thinking': return '💭';
      case 'tool_call': return '🛠️';
      case 'tool_result': return '✅';
      case 'agent_iteration': return '🔄';
      case 'error': return '❌';
      default: return '•';
    }
  }

  function tryParseResult(summary: string | undefined): any {
    if (!summary) return null;
    if (typeof summary === 'object') return summary; // Already an object
    try {
      if (summary.trim().startsWith('{') || summary.trim().startsWith('[')) {
        return JSON.parse(summary);
      }
    } catch (e) { /* ignore */ }
    return null;
  }
</script>

<div class="agent-reasoning bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden text-xs font-mono mb-4 shadow-lg">
  <button 
    class="w-full px-3 py-2 bg-[#111] hover:bg-[#222] text-left flex justify-between items-center text-gray-400 transition-colors"
    on:click={() => expanded = !expanded}
  >
    <span class="flex items-center gap-2">
      {#if isProcessing}
        <span class="animate-spin">⚙️</span>
      {:else}
        🤖
      {/if}
      Agent Reasoning <span class="text-gray-600">({events.length} steps)</span>
    </span>
    <span class="text-gray-600 text-[10px]">{expanded ? 'HIDE' : 'SHOW'}</span>
  </button>

  {#if expanded}
    <div 
      class="p-3 space-y-3 max-h-80 overflow-y-auto bg-[#0f0f0f]" 
      transition:slide|local 
      bind:this={containerRef}
    >
      {#if events.length === 0 && isProcessing}
         <div class="text-gray-500 pl-2 animate-pulse">Initializing agent...</div>
      {/if}
      
      {#each events as event, i}
        <div class="event-item relative pl-4 {i < events.length - 1 ? 'border-l border-[#333]' : ''} pb-4 last:pb-0">
            <!-- Timeline dot -->
            <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f0f0f] {event.type === 'error' ? 'bg-red-500' : 'bg-gray-600'}"></div>

          <div class="flex items-center gap-2 text-gray-500 mb-1 leading-none">
            <span>{getIcon(event.type)}</span>
            <span class="uppercase tracking-wider text-[10px] font-bold text-gray-400">{event.type.replace('agent_', '').replace('_', ' ')}</span>
            {#if event.iteration}
              <span class="bg-[#222] px-1.5 py-0.5 rounded text-[9px] text-gray-500">ITER {event.iteration}</span>
            {/if}
          </div>
          
          <div class="text-gray-300 pl-6">
            {#if event.type === 'agent_thinking'}
              <div class="flex flex-col gap-1">
                <p class="italic text-gray-400 leading-relaxed">"{event.thought}"</p>
                {#if event.action}
                    <span class="text-[9px] uppercase tracking-wider text-blue-500 font-semibold">Action: {event.action}</span>
                {/if}
              </div>
            {:else if event.type === 'tool_call'}
              <div class="flex flex-col gap-2 mt-1 bg-[#1a1a1a] p-2 rounded border border-[#333]">
                {#if event.reasoning}
                    <div class="text-[10px] text-gray-500 italic border-b border-[#333] pb-1 mb-1">{event.reasoning}</div>
                {/if}
                <span class="font-bold text-blue-400 flex items-center gap-2">
                    {#if TOOL_DISPLAY_CONFIG[event.tool_name]}
                        <span class="text-base">{TOOL_DISPLAY_CONFIG[event.tool_name].icon}</span>
                        {TOOL_DISPLAY_CONFIG[event.tool_name].label}
                    {:else}
                        {event.tool_name}
                    {/if}
                </span>
                {#if event.parameters}
                  <details class="group/params mt-1">
                    <summary class="cursor-pointer text-[10px] text-gray-500 hover:text-gray-300 select-none flex items-center gap-1 outline-none list-none">
                        <span class="transform transition-transform duration-200 group-open/params:rotate-90 inline-block">▶</span>
                        <span>View Parameters</span>
                    </summary>
                    <pre class="text-[10px] text-gray-500 overflow-x-auto custom-scrollbar mt-1 bg-[#151515] p-2 rounded border border-[#333]">{JSON.stringify(event.parameters, null, 2)}</pre>
                  </details>
                {/if}
              </div>
            {:else if event.type === 'tool_result'}
              <div class="flex flex-col gap-1 mt-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-[10px] {event.success !== false ? 'text-green-400' : 'text-red-400'}">
                    {event.success !== false ? 'SUCCESS' : 'FAILED'}
                    </span>
                    {#if event.result_count !== undefined}
                        <span class="text-[9px] text-gray-500">• {event.result_count} results</span>
                    {/if}
                    {#if event.execution_time_ms}
                        <span class="text-[9px] text-gray-500">• {event.execution_time_ms}ms</span>
                    {/if}
                </div>
                
                {#if event.success !== false}
                    {@const parsedResult = tryParseResult(event.result_summary)}
                    
                    {#if event.tool_name === 'calculate_budget' && parsedResult}
                        <BudgetCalculationResult result={parsedResult} />
                    {:else if event.tool_name === 'generate_timeline' && parsedResult}
                        <TimelineResult result={parsedResult} />
                    {:else if event.result_summary}
                        <p class="text-gray-400 bg-[#1a1a1a] p-2 rounded border border-[#333]">{event.result_summary}</p>
                    {/if}
                {:else if event.result_summary}
                  <p class="text-gray-400 bg-[#1a1a1a] p-2 rounded border border-[#333]">{event.result_summary}</p>
                {/if}
              </div>
            {:else if event.type === 'agent_iteration'}
               <p class="text-gray-500 text-[10px]">Loop completed.</p>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if isProcessing}
        <div class="pl-4 border-l border-[#333] border-dashed h-8 relative">
             <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f0f0f] bg-blue-500 animate-pulse"></div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 2px;
  }

  details > summary {
    list-style: none;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }
</style>