<script lang="ts">
  import type { ProcessingStage } from '$lib/stores/streamingConversationStore';

  export let stage: ProcessingStage | null;
  export let showWhenSending: boolean = false;

  // Function to choose the better message between server message and our default
  function getBetterMessage(stageKey: string, serverMessage: string): string {
    const defaultDescription = stageDescriptions[stageKey];

    // If server message is more descriptive (longer) than default, use it
    if (serverMessage && serverMessage.length > (defaultDescription?.length || 0)) {
      return serverMessage;
    }

    // If server message contains useful additional info, use it
    if (serverMessage && (
      serverMessage.includes('...') ||
      serverMessage.includes('databases') ||
      serverMessage.includes('context') ||
      serverMessage.includes('memory') ||
      serverMessage.includes('EU')
    )) {
      return serverMessage;
    }

    // Otherwise use our default description
    return defaultDescription || serverMessage || 'Processing...';
  }
  
  const stageIcons: Record<string, string> = {
    'processing': '⚙️',
    'storing_message': '💾',
    'analyzing_intent': '🧠',
    'intent_detected': '✅',
    'executing_tools': '🔧',
    'tools_complete': '✅',
    'generating_response': '💭',
    'context_resolution': '🧠',
    'reference_resolved': '🎯',
    'intent_detection': '🤖',
    'query_extraction': '🔍',
    'queries_extracted': '📝',
    'data_retrieval': '📡',
    'data_enriched': '✨',
    'data_selected': '🎯',
    'reranking': '📊',
    'answer_generation': '💭',
    'context_enhancement': '🔗',
    'streaming_response': '📤',
    'route_selected': '🎯'
  };

  const stageDescriptions: Record<string, string> = {
    'processing': 'Processing your request',
    'storing_message': 'Saving your message',
    'analyzing_intent': 'Understanding your request',
    'intent_detected': 'Intent identified',
    'executing_tools': 'Searching databases',
    'tools_complete': 'Search complete',
    'generating_response': 'Generating response',
    'context_resolution': 'Loading conversation context and memory',
    'reference_resolved': 'Resolving references in your question',
    'intent_detection': 'Analyzing your question',
    'query_extraction': 'Extracting search terms',
    'queries_extracted': 'Search queries prepared',
    'data_retrieval': 'Processing search results from EU databases',
    'data_enriched': 'Enriching and formatting search results',
    'data_selected': 'Selecting most relevant results',
    'reranking': 'Ranking results by relevance',
    'answer_generation': 'Generating response based on processed data',
    'context_enhancement': 'Adding conversational context',
    'streaming_response': 'Starting response stream',
    'route_selected': 'Route selected'
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
          <!-- Use server message if it's different and more descriptive than our default -->
          {getBetterMessage(effectiveStage.stage, effectiveStage.message)}
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
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #2C2C2C 0%, #1F1F1F 100%);
    border: 1px solid #4F4F4F;
    border-radius: 12px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .stage-indicator.pulsing {
    animation: pulse 2s infinite;
  }

  .stage-indicator.pulsing:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .stage-icon {
    font-size: 1.25rem;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: iconFloat 3s ease-in-out infinite;
  }

  .stage-content {
    flex: 1;
  }

  .stage-title {
    font-weight: 600;
    color: #E0E0E0;
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
  }

  .stage-message {
    color: #B0B0B0;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .route-chip {
    margin-top: 0.35rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    border-radius: 9999px;
    background: linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%);
    border: 1px solid #3A3A3A;
    color: #E0E0E0;
    font-size: 0.75rem;
    transition: all 0.2s ease;
  }

  .route-chip:hover {
    background: linear-gradient(135deg, #252525 0%, #303030 100%);
    border-color: #4A4A4A;
  }

  .route-value {
    font-weight: 600;
    color: #4A90E2;
  }

  .confidence {
    color: #B0B0B0;
    font-weight: 500;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }

  @keyframes iconFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-2px);
    }
  }
</style>