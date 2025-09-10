<script lang="ts">
  let {
    suggestions = [],
    onSelect
  } = $props();

  // Function to handle suggestion click
  function handleSuggestionClick(suggestion: string) {
    onSelect?.(suggestion);
  }
</script>

{#if suggestions.length > 0}
  <div class="follow-up-suggestions">
    <div class="suggestions-header">
      <span class="suggestions-title">Follow-up suggestions</span>
      <span class="suggestions-hint">Click to use</span>
    </div>
    
    <div class="suggestions-grid">
      {#each suggestions as suggestion}
        <button
          class="suggestion-button"
          on:click={() => handleSuggestionClick(suggestion)}
          title="Click to use this suggestion"
        >
          <div class="suggestion-content">
            <span class="suggestion-text">{suggestion}</span>
            <div class="suggestion-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .follow-up-suggestions {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border: 1px solid #4b5563;
    border-radius: 12px;
    padding: 16px;
    margin: 20px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .suggestions-title {
    font-size: 14px;
    font-weight: 600;
    color: #e5e7eb;
  }

  .suggestions-hint {
    font-size: 12px;
    color: #9ca3af;
  }

  .suggestions-grid {
    display: grid;
    gap: 8px;
  }

  .suggestion-button {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4b5563;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .suggestion-button:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
  }

  .suggestion-button:active {
    transform: translateY(0);
  }

  .suggestion-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .suggestion-text {
    flex: 1;
    color: #e5e7eb;
    font-size: 14px;
    line-height: 1.4;
    text-align: left;
  }

  .suggestion-arrow {
    color: #9ca3af;
    opacity: 0;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }

  .suggestion-button:hover .suggestion-arrow {
    opacity: 1;
    color: #3b82f6;
  }

  /* Animation for new suggestions */
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .suggestion-button {
    animation: slideInUp 0.3s ease-out;
  }

  .suggestion-button:nth-child(1) { animation-delay: 0.05s; }
  .suggestion-button:nth-child(2) { animation-delay: 0.1s; }
  .suggestion-button:nth-child(3) { animation-delay: 0.15s; }
  .suggestion-button:nth-child(4) { animation-delay: 0.2s; }
</style>