<script lang="ts">
  import Icon from '$lib/components/generic/icon.svelte';
  import type { Citation } from '$lib/types/schema';

  export let call: any; // We'll parse the object structure here
  export let onSave: ((call: any) => void) | undefined = undefined;

  // Parse helper if call is not already structured
  // But we assume the parent component will do the regex parsing or we get structured data
  
  const STATUS_COLORS: Record<string, string> = {
    'open': 'bg-green-500/20 text-green-400 border-green-500/30',
    'upcoming': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'closed': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const TYPE_ICONS: Record<string, string> = {
    'RIA': '🔬', 'IA': '🚀', 'CSA': '🤝', 'COFUND': '💱',
    'ERC': '🎓', 'MSCA': '👨‍🔬', 'LUMP-SUM': '📦', 'PCP': '🔧', 'PPI': '🛒'
  };
</script>

<div class="funding-call-card bg-[#1E1E1E] border border-gray-700 hover:border-blue-500/50 rounded-lg p-4 my-3 transition-all font-sans group relative">
  <div class="flex justify-between items-start gap-3 mb-3">
    <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
            {#if call.callId}
                <span class="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded select-all">{call.callId}</span>
            {/if}
            {#if call.status}
                <span class="text-[10px] px-2 py-0.5 rounded-full border {STATUS_COLORS[call.status.toLowerCase()] || 'bg-gray-700 text-gray-300'} capitalize">
                    {call.status}
                </span>
            {/if}
        </div>
        <h3 class="text-base font-semibold text-blue-400 group-hover:text-blue-300 leading-tight">
            {call.title}
        </h3>
    </div>
    {#if onSave}
        <button class="text-gray-500 hover:text-yellow-400 transition-colors" on:click={() => onSave(call)} title="Save Call">
            <Icon name="star_border" className="text-lg" />
        </button>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-3 text-gray-300">
    {#if call.type}
        <div class="flex items-center gap-1.5">
            <span class="text-gray-500">{TYPE_ICONS[call.type] || '📋'}</span>
            <span class="font-medium">{call.type}</span>
        </div>
    {/if}
    {#if call.deadline}
        <div class="flex items-center gap-1.5">
            <span class="text-gray-500">⏰</span>
            <span>{call.deadline}</span>
        </div>
    {/if}
    {#if call.budget}
        <div class="flex items-center gap-1.5">
            <span class="text-gray-500">💰</span>
            <span>{call.budget}</span>
        </div>
    {/if}
    {#if call.programme}
        <div class="flex items-center gap-1.5">
            <span class="text-gray-500">🏛️</span>
            <span class="truncate">{call.programme}</span>
        </div>
    {/if}
  </div>

  {#if call.scope}
      <div class="text-xs text-gray-400 leading-relaxed border-t border-gray-800 pt-2 line-clamp-3 hover:line-clamp-none transition-all">
          {call.scope}
      </div>
  {/if}

  {#if call.applyLink}
    <div class="mt-3 pt-2 border-t border-gray-800 flex justify-end">
        <a href={call.applyLink} target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
            Apply on EU Portal <Icon name="open_in_new" className="text-[10px]" />
        </a>
    </div>
  {/if}
</div>
