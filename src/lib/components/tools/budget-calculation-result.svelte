<script lang="ts">
  import Icon from '$lib/components/generic/icon.svelte';

  export let result: any;

  // Helper to format numbers as currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val: number) => `${val}%`;
  
  const benchmarkStatusColor = {
    'within range': 'text-green-400',
    'below typical': 'text-yellow-400',
    'above typical': 'text-red-400'
  };
</script>

<div class="budget-result bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 my-4 font-sans">
  <!-- Summary Header -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-b border-gray-700 pb-4">
    <div>
      <div class="text-xs text-gray-400 uppercase tracking-wider">Total Budget</div>
      <div class="text-2xl font-bold text-white">{formatCurrency(result.calculated_budget.total_cost)}</div>
    </div>
    <div>
      <div class="text-xs text-gray-400 uppercase tracking-wider">EU Contribution</div>
      <div class="text-xl font-semibold text-blue-400">
        {formatCurrency(result.calculated_budget.eu_contribution)}
        <span class="text-xs text-gray-500 ml-1">({result.calculated_budget.funding_rate})</span>
      </div>
    </div>
    <div>
      <div class="text-xs text-gray-400 uppercase tracking-wider">Benchmark</div>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-sm font-medium {benchmarkStatusColor[result.benchmarks.your_budget_vs_median] || 'text-gray-400'}">
            {result.benchmarks.your_budget_vs_median === 'within range' ? '✅' : '⚠️'}
            {result.benchmarks.your_budget_vs_median}
        </span>
      </div>
      <div class="text-xs text-gray-500 mt-0.5">Typical: {result.benchmarks.typical_range}</div>
    </div>
  </div>

  <!-- Breakdown Bars -->
  <div class="mb-6">
    <h4 class="text-sm font-medium text-gray-300 mb-3">Budget Breakdown</h4>
    <div class="space-y-3">
      {#each Object.entries(result.breakdown) as [key, data]}
        <div class="flex flex-col gap-1">
          <div class="flex justify-between text-xs">
            <span class="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
            <span class="text-gray-400">{formatCurrency(data.amount)} ({data.percentage}%)</span>
          </div>
          <div class="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div class="bg-blue-500 h-full rounded-full" style="width: {data.percentage}%"></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Effort Summary -->
  <div class="bg-[#252525] rounded p-3 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
    <div>
      <div class="text-gray-500">Total Effort</div>
      <div class="text-gray-200 font-medium">{result.effort_summary.total_person_months} PM</div>
    </div>
    <div>
      <div class="text-gray-500">Avg / Partner</div>
      <div class="text-gray-200 font-medium">{result.effort_summary.person_months_per_partner} PM</div>
    </div>
    <div>
      <div class="text-gray-500">Avg PM Cost</div>
      <div class="text-gray-200 font-medium">{formatCurrency(result.effort_summary.avg_pm_cost_used)}</div>
    </div>
    <div>
      <div class="text-gray-500">Duration</div>
      <div class="text-gray-200 font-medium">36 Months</div> 
      <!-- Note: Duration is not in the budget response structure explicitly, assuming standard or calculating from elsewhere if needed -->
    </div>
  </div>

  <!-- Recommendations -->
  {#if result.recommendations && result.recommendations.length > 0}
    <div class="mt-4">
      <h4 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
        <Icon name="lightbulb" className="text-yellow-500 text-sm" />
        Recommendations
      </h4>
      <ul class="space-y-1">
        {#each result.recommendations as rec}
          <li class="text-xs text-gray-400 flex items-start gap-2">
            <span class="text-blue-500 mt-0.5">•</span>
            <span>{rec}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
