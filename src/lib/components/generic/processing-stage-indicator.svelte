<script lang="ts">
  import type { ProcessingStage } from '$lib/stores/streamingConversationStore';
  
  export let stage: ProcessingStage | null;
  export let showWhenSending: boolean = false;
  
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
    'streaming_response': '📤',
    'processing': '⚙️'
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
    'streaming_response': 'Delivering your answer',
    'processing': 'Processing your request'
  };
</script>

{#if stage || showWhenSending}
  {@const effectiveStage = stage || { stage: 'processing', message: 'Preparing your response...', timestamp: new Date().toISOString() }}
  <div class="stage-indicator" class:pulsing={effectiveStage.stage !== 'streaming_response'}>
    <div class="stage-icon">
      {stageIcons[effectiveStage.stage] || '⚙️'}
    </div>
    <div class="stage-content">
      <div class="stage-title">
        {stageDescriptions[effectiveStage.stage] || effectiveStage.stage}
      </div>
      <div class="stage-message">
        {#if effectiveStage.routingDecision}
          Route Selected: {effectiveStage.routingDecision}
          {#if effectiveStage.intentConfidence !== undefined}
            ({Math.round((effectiveStage.intentConfidence || 0) * 100)}%)
          {/if}
        {:else}
          {effectiveStage.message}
        {/if}
      </div>
      {#if effectiveStage.routingDecision && effectiveStage.stage !== 'route_selected'}
        <div class="route-chip">
          Route: <span class="route-value">{effectiveStage.routingDecision}</span>
          {#if effectiveStage.intentConfidence !== undefined}
            <span class="confidence">({Math.round((effectiveStage.intentConfidence || 0) * 100)}%)</span>
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