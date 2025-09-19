<script lang="ts">
  import type { ProcessingStage } from '$lib/stores/streamingConversationStore';
  
  export let stage: ProcessingStage | null;
  
  const stageIcons: Record<string, string> = {
    'context_resolution': '🧠',
    'reference_resolved': '🎯',
    'intent_detection': '🤖',
    'intent_detected': '✅',
    'query_extraction': '🔍',
    'queries_extracted': '📝',
    'data_retrieval': '📡',
    'data_enriched': '✨',
    'data_selected': '🎯',
    'reranking': '📊',
    'answer_generation': '💭',
    'context_enhancement': '🔗',
    'streaming_response': '📤'
  };
  
  const stageDescriptions: Record<string, string> = {
    'context_resolution': 'Loading conversation context',
    'reference_resolved': 'Resolved references in your question',
    'intent_detection': 'Understanding your question',
    'intent_detected': 'Question intent identified',
    'route_selected': 'Route Selected',
    'query_extraction': 'Extracting search terms',
    'queries_extracted': 'Search queries ready',
    'data_retrieval': 'Searching CORDIS database',
    'data_enriched': 'Enriching with additional data',
    'data_selected': 'Selecting most relevant projects',
    'reranking': 'Ranking projects by relevance',
    'answer_generation': 'Generating comprehensive answer',
    'context_enhancement': 'Adding conversational context',
    'streaming_response': 'Delivering your answer'
  };
</script>

{#if stage}
  <div class="stage-indicator" class:pulsing={stage.stage !== 'streaming_response'}>
    <div class="stage-icon">
      {stageIcons[stage.stage] || '⚙️'}
    </div>
    <div class="stage-content">
      <div class="stage-title">
        {stageDescriptions[stage.stage] || stage.stage}
      </div>
      <div class="stage-message">
        {#if stage.routingDecision}
          Route Selected: {stage.routingDecision}
          {#if stage.intentConfidence !== undefined}
            ({Math.round((stage.intentConfidence || 0) * 100)}%)
          {/if}
        {:else}
          {stage.message}
        {/if}
      </div>
      {#if stage.routingDecision && stage.stage !== 'route_selected'}
        <div class="route-chip">
          Route: <span class="route-value">{stage.routingDecision}</span>
          {#if stage.intentConfidence !== undefined}
            <span class="confidence">({Math.round((stage.intentConfidence || 0) * 100)}%)</span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .stage-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #2C2C2C; /* palette.secondary.dark */
    border: 1px solid #4F4F4F; /* palette.secondary.light */
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }
  
  .stage-indicator.pulsing {
    animation: pulse 2s infinite;
  }
  
  .stage-icon {
    font-size: 1.2rem;
    min-width: 24px;
  }
  
  .stage-content {
    flex: 1;
  }
  
  .stage-title {
    font-weight: 600;
    color: #E0E0E0; /* palette.text.primary */
    margin-bottom: 0.25rem;
  }
  
  .stage-message {
    color: #B0B0B0; /* palette.text.secondary */
    font-size: 0.85rem;
  }

.route-chip {
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background: #1E1E1E; /* palette.primary.surface */
  border: 1px solid #3A3A3A; /* palette.secondary.main */
  color: #E0E0E0; /* palette.text.primary */
  font-size: 0.75rem;
}

.route-value {
  font-weight: 600;
}

.confidence {
  color: #B0B0B0; /* palette.text.secondary */
}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>