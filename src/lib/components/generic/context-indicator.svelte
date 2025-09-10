<script lang="ts">
  import Icon from './icon.svelte';

  let {
    projectCount = 0,
    messageCount = 0,
    isContextual = true,
    topics = [],
    onToggle
  } = $props();

  // Limit topics display to 3 items
  const displayTopics = $derived(topics.slice(0, 3));
  const hasMoreTopics = $derived(topics.length > 3);
</script>

<div class="context-indicator">
  <div class="context-header">
    <div class="context-title">
      <Icon name="history" className="text-blue-400" />
      <span>Conversation Context</span>
      <div class="context-toggle">
        <button
          class="toggle-button"
          on:click={() => onToggle?.()}
          title={isContextual ? 'Disable context' : 'Enable context'}
        >
          <span class="toggle-label">{isContextual ? 'ON' : 'OFF'}</span>
          <div class="toggle-track {isContextual ? 'bg-blue-500' : 'bg-gray-600'}">
            <div class="toggle-thumb {isContextual ? 'translate-x-4' : 'translate-x-0'}"></div>
          </div>
        </button>
      </div>
    </div>
  </div>

  <div class="context-stats">
    <div class="stat">
      <span class="stat-number">{messageCount}</span>
      <span class="stat-label">messages</span>
    </div>
    <div class="stat">
      <span class="stat-number">{projectCount}</span>
      <span class="stat-label">projects</span>
    </div>
  </div>

  {#if displayTopics.length > 0}
    <div class="context-topics">
      <span class="topics-label">Topics:</span>
      <div class="topics-list">
        {#each displayTopics as topic}
          <span class="topic-tag">{topic}</span>
        {/each}
        {#if hasMoreTopics}
          <span class="topic-more">+{topics.length - 3} more</span>
        {/if}
      </div>
    </div>
  {/if}

  {#if !isContextual}
    <div class="context-warning">
      <Icon name="warning" className="text-yellow-400" />
      <span>Context is disabled - AI won't remember previous messages</span>
    </div>
  {/if}
</div>

<style>
  .context-indicator {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border: 1px solid #4b5563;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .context-header {
    margin-bottom: 12px;
  }

  .context-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #e5e7eb;
  }

  .context-toggle {
    margin-left: auto;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .toggle-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .toggle-label {
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
    min-width: 24px;
    text-align: center;
  }

  .toggle-track {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    position: relative;
    transition: background-color 0.2s;
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .context-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-number {
    font-size: 18px;
    font-weight: 700;
    color: #60a5fa;
  }

  .stat-label {
    font-size: 12px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .context-topics {
    margin-bottom: 12px;
  }

  .topics-label {
    display: block;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .topics-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .topic-tag {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .topic-more {
    color: #9ca3af;
    font-size: 11px;
    font-style: italic;
  }

  .context-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: 6px;
    color: #fbbf24;
    font-size: 12px;
  }
</style>