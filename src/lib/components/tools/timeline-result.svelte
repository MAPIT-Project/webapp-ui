<script lang="ts">
  import Icon from '$lib/components/generic/icon.svelte';

  export let result: any;

  // Constants for styling
  const WP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

  function getWPColor(index: number) {
    return WP_COLORS[(index - 1) % WP_COLORS.length];
  }
</script>

<div class="timeline-result bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 my-4 font-sans overflow-hidden">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-700 pb-4">
    <div>
      <h3 class="text-lg font-bold text-white">{result.project_title}</h3>
      <div class="flex gap-3 text-xs text-gray-400 mt-1">
        <span>{result.parameters.action_type}</span>
        <span>•</span>
        <span>{result.parameters.duration_months} months</span>
        <span>•</span>
        <span>{result.parameters.num_partners} partners</span>
      </div>
    </div>
    <div class="text-right">
       <div class="text-sm font-medium text-gray-300">{result.summary.total_wps} Work Packages</div>
       <div class="text-xs text-gray-500">{result.summary.total_deliverables} Deliverables • {result.summary.total_milestones} Milestones</div>
    </div>
  </div>

  <!-- Gantt Chart Container -->
  <div class="overflow-x-auto mb-6 custom-scrollbar">
    <div class="min-w-[600px]">
      <!-- Month Headers -->
      <div class="flex mb-2 ml-[150px]">
        {#each Array.from({ length: result.parameters.duration_months }) as _, i}
           <div class="flex-1 text-[10px] text-gray-500 text-center border-l border-gray-800">
             {i + 1}
           </div>
        {/each}
      </div>

      <!-- WP Rows -->
      <div class="space-y-3">
        {#each result.work_packages as wp}
          <div class="flex items-center group">
            <!-- Label -->
            <div class="w-[150px] flex-shrink-0 pr-4">
              <div class="text-xs font-medium text-gray-200 truncate" title={wp.title}>WP{wp.number}: {wp.title}</div>
              <div class="text-[10px] text-gray-500 truncate">{wp.lead} • {wp.effort_pms} PM</div>
            </div>
            
            <!-- Bar Track -->
            <div class="flex-1 relative h-8 bg-[#252525] rounded flex items-center">
               <!-- Bar -->
               <div 
                 class="absolute h-5 rounded text-[10px] text-white/90 flex items-center justify-center font-medium shadow-sm transition-all group-hover:h-6"
                 style="
                   left: {(wp.start_month - 1) / result.parameters.duration_months * 100}%;
                   width: {(wp.duration_months) / result.parameters.duration_months * 100}%;
                   background-color: {getWPColor(wp.number)};
                 "
               >
                  WP{wp.number}
               </div>

               <!-- Markers within track (simplified) -->
               {#each result.milestones.filter(m => m.related_wp === wp.number) as ms}
                  <div 
                    class="absolute w-0.5 h-full bg-white/50 z-10 flex flex-col items-center justify-center group/ms"
                    style="left: {(ms.due_month) / result.parameters.duration_months * 100}%"
                  >
                     <div class="w-2 h-2 bg-yellow-400 rotate-45 -mt-8"></div>
                  </div>
               {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Lists Container -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-700 pt-6">
    <!-- Milestones -->
    <div>
       <h4 class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
         <span class="w-2 h-2 bg-yellow-400 rotate-45"></span> Milestones
       </h4>
       <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
          {#each result.milestones as ms}
            <div class="flex items-start gap-2 text-xs p-2 rounded bg-[#252525] border border-gray-700/50">
               <span class="font-bold text-yellow-500 shrink-0 w-8">{ms.id}</span>
               <div class="flex-1 min-w-0">
                  <div class="text-gray-300 truncate">{ms.title}</div>
                  <div class="text-gray-500 mt-0.5">Due M{ms.due_month}</div>
               </div>
            </div>
          {/each}
       </div>
    </div>

    <!-- Deliverables -->
    <div>
       <h4 class="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
         <Icon name="description" className="text-blue-400 text-xs" /> Deliverables
       </h4>
       <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
          {#each result.deliverables as del}
            <div class="flex items-start gap-2 text-xs p-2 rounded bg-[#252525] border border-gray-700/50">
               <span class="font-bold text-blue-400 shrink-0 w-10">{del.seq_id}</span>
               <div class="flex-1 min-w-0">
                  <div class="text-gray-300 truncate">{del.title}</div>
                  <div class="flex gap-2 mt-0.5">
                     <span class="text-gray-500">M{del.due_month}</span>
                     <span class="px-1.5 py-0.5 rounded bg-gray-700 text-[10px] text-gray-300">{del.type}</span>
                     <span class="px-1.5 py-0.5 rounded bg-gray-700 text-[10px] text-gray-300">{del.dissemination_level}</span>
                  </div>
               </div>
            </div>
          {/each}
       </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1A1A1A;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 2px;
  }
</style>
