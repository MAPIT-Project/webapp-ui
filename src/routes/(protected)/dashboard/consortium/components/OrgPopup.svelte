<script lang="ts">
  export let name: string;
  export let organisationID: string;
  export let weight: number;
  export let matchingProjects: Array<{
    projectID: number;
    title: string;
    contribution: number;
    objective?: string;
  }> = [];
  
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-EU', { 
      maximumFractionDigits: 0 
    }).format(num);
  }
</script>

<div class="font-sans p-0 text-black">
  <h3 class="m-0 mb-2 text-sm font-bold text-black">{name}</h3>
  <p class="my-1 text-xs text-black">ID: {organisationID}</p>
  <p class="my-1 text-xs font-bold text-black">Total Contribution: €{formatNumber(weight)}</p>
  
  {#if matchingProjects.length > 0}
    <div>
      <h4 class="mt-3 mb-1 text-[13px] text-black font-semibold">Matching Projects ({matchingProjects.length}):</h4>
      <ul class="list-none p-0 m-0">
        {#each matchingProjects.slice(0, 3) as project}
          <li class="mb-1.5 pb-1.5 border-b border-gray-200 text-xs">
            <div class="font-bold text-black">{project.title}</div>
            <div class="text-[#4285F4]">€{formatNumber(project.contribution)}</div>
          </li>
        {/each}
        
        {#if matchingProjects.length > 3}
          <li class="italic text-gray-700 text-right text-xs">+{matchingProjects.length - 3} more projects</li>
        {/if}
      </ul>
    </div>
  {/if}
</div>

<style>
  .org-popup {
    font-family: Arial, sans-serif;
    padding: 0;
  }
  
  h3 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: bold;
  }
  
  p {
    margin: 4px 0;
    font-size: 12px;
  }
  
  .contribution {
    font-weight: bold;
    color: #333;
  }
  
  .matching-projects h4 {
    margin: 12px 0 5px;
    font-size: 13px;
    color: #333;
  }
  
  .project-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .project-list li {
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
    font-size: 12px;
  }
  
  .project-list li:last-child {
    border-bottom: none;
  }
  
  .project-title {
    font-weight: bold;
  }
  
  .project-contribution {
    color: #4285F4;
  }
  
  .more-projects {
    font-style: italic;
    color: #666;
    text-align: right;
  }
</style>