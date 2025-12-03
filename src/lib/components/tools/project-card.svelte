<script lang="ts">
  import Icon from '$lib/components/generic/icon.svelte';

  export let project: any;

  const STATUS_COLORS: Record<string, string> = {
      'ongoing': 'text-green-400',
      'closed': 'text-gray-400',
      'completed': 'text-blue-400'
  };
</script>

<div class="project-card bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 my-3 font-sans group">
  <div class="flex justify-between items-start gap-3 mb-3">
      <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
             <span class="text-xs font-bold text-purple-400 tracking-wide">{project.acronym}</span>
             {#if project.status}
                 <span class="text-[10px] font-medium {STATUS_COLORS[project.status.toLowerCase()] || 'text-gray-400'} uppercase px-1.5 py-0.5 bg-gray-800 rounded">
                     {project.status}
                 </span>
             {/if}
          </div>
          <h3 class="text-sm font-semibold text-gray-100 leading-snug">
              {project.title}
          </h3>
      </div>
  </div>

  <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-3 text-gray-300 border-b border-gray-800 pb-3">
      {#if project.id}
          <div class="flex items-center gap-1.5">
              <span class="text-gray-500">🔢</span>
              <span>{project.id}</span>
          </div>
      {/if}
      {#if project.ecMaxContribution}
          <div class="flex items-center gap-1.5">
              <span class="text-gray-500">💰</span>
              <span>€{new Intl.NumberFormat().format(project.ecMaxContribution)}</span>
          </div>
      {/if}
      {#if project.startDate && project.endDate}
          <div class="flex items-center gap-1.5 col-span-2">
              <span class="text-gray-500">📅</span>
              <span>{project.startDate} → {project.endDate}</span>
          </div>
      {/if}
      {#if project.coordinator}
          <div class="flex items-center gap-1.5 col-span-2">
              <span class="text-gray-500">🏢</span>
              <span class="truncate">{project.coordinator}</span>
          </div>
      {/if}
  </div>

  {#if project.objective}
      <div class="mb-3">
          <h4 class="text-[10px] uppercase text-gray-500 font-bold mb-1">Objective</h4>
          <p class="text-xs text-gray-400 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
              {project.objective}
          </p>
      </div>
  {/if}

  {#if project.publications && project.publications.length > 0}
      <div class="mb-3 border-t border-gray-800 pt-2">
          <h4 class="text-[10px] uppercase text-gray-500 font-bold mb-1 flex items-center gap-1">
              📚 Key Publications <span class="text-gray-600">({project.publications.length})</span>
          </h4>
          <div class="space-y-2">
              {#each project.publications.slice(0, 2) as pub}
                  <div class="text-xs bg-gray-800/50 p-2 rounded">
                      <div class="font-medium text-gray-300 line-clamp-1" title={pub.title}>{pub.title}</div>
                      <div class="text-[10px] text-gray-500 mt-0.5 truncate">{pub.authors}</div>
                      {#if pub.doi}
                          <a href={`https://doi.org/${pub.doi}`} target="_blank" class="text-[10px] text-blue-500 hover:underline mt-1 block">DOI: {pub.doi}</a>
                      {/if}
                  </div>
              {/each}
          </div>
      </div>
  {/if}

  {#if project.impact_metrics}
      <div class="grid grid-cols-4 gap-2 border-t border-gray-800 pt-2">
          <div class="text-center">
              <div class="text-lg font-bold text-gray-300">{project.impact_metrics.publications_count}</div>
              <div class="text-[9px] text-gray-500 uppercase">Pubs</div>
          </div>
          <div class="text-center">
              <div class="text-lg font-bold text-gray-300">{project.impact_metrics.deliverables_count}</div>
              <div class="text-[9px] text-gray-500 uppercase">Dels</div>
          </div>
          <div class="text-center">
              <div class="text-lg font-bold text-gray-300">{project.impact_metrics.patents_count}</div>
              <div class="text-[9px] text-gray-500 uppercase">Patents</div>
          </div>
           <div class="text-center">
              <div class="text-lg font-bold text-gray-300">{project.impact_metrics.datasets_count}</div>
              <div class="text-[9px] text-gray-500 uppercase">Data</div>
          </div>
      </div>
  {/if}

  <div class="mt-3 pt-2 border-t border-gray-800 flex justify-end">
       <a href={`https://cordis.europa.eu/project/id/${project.id}`} target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
          View on CORDIS <Icon name="open_in_new" className="text-[10px]" />
      </a>
  </div>
</div>
