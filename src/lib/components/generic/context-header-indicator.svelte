<script lang="ts">
  import Icon from './icon.svelte';
  import { conversationContextStore } from '$lib/stores/conversationContextStore';

  let {
    projectCount = 0,
    messageCount = 0,
    isContextual = true,
    topics = [],
    onToggle
  } = $props();

  // Limit topics display to 2 items for compact view
  const displayTopics = $derived(topics.slice(0, 2));
  const hasMoreTopics = $derived(topics.length > 2);
</script>

<div class="context-header-indicator" on:mouseenter on:mouseleave>
  <!-- Compact icon that shows tooltip on hover -->
  <div class="indicator-icon" class:disabled={!isContextual}>
    <Icon name="history" className="icon" />
    {#if messageCount > 0}
      <div class="message-badge">{messageCount}</div>
    {/if}
  </div>

  <!-- Tooltip that appears on hover -->
  <div class="context-tooltip">
    <div class="tooltip-content">
      <!-- Header -->
      <div class="tooltip-header">
        <Icon name="history" className="text-accent" />
        <span>Conversation Context</span>
        <div class="context-toggle">
          <button
            class="toggle-button"
            on:click|stopPropagation={() => onToggle?.()}
            title={isContextual ? 'Disable context' : 'Enable context'}
          >
            <span class="toggle-label">{isContextual ? 'ON' : 'OFF'}</span>
            <div class="toggle-track {isContextual ? 'bg-accent' : 'bg-secondary-light'}">
              <div class="toggle-thumb {isContextual ? 'translate-x-4' : 'translate-x-0'}"></div>
            </div>
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="tooltip-stats">
        <div class="stat">
          <span class="stat-number">{messageCount}</span>
          <span class="stat-label">messages</span>
        </div>
        <div class="stat">
          <span class="stat-number">{projectCount}</span>
          <span class="stat-label">projects</span>
        </div>
      </div>

      <!-- Topics -->
      {#if displayTopics.length > 0}
        <div class="tooltip-topics">
          <span class="topics-label">Topics:</span>
          <div class="topics-list">
            {#each displayTopics as topic}
              <span class="topic-tag">{topic}</span>
            {/each}
            {#if hasMoreTopics}
              <span class="topic-more">+{topics.length - 2} more</span>
            {/if}
          </div>
        </div>
      {/if}

      {#if !isContextual}
        <div class="tooltip-warning">
          <Icon name="warning" className="text-warning" />
          <span>Context disabled - AI won't remember previous messages</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .context-header-indicator {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .indicator-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: rgba(63, 63, 70, 0.3); /* secondary-main with opacity */
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .indicator-icon:hover {
    background-color: rgba(63, 63, 70, 0.5); /* secondary-main with more opacity */
  }

  .indicator-icon.disabled {
    opacity: 0.5;
  }

  .icon {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
  }

  .message-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background-color: var(--status-info);
    color: white;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .context-tooltip {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.2s ease;
    z-index: 50;
    min-width: 280px;
  }

  .context-header-indicator:hover .context-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .tooltip-content {
    background-color: var(--primary-surface);
    border: 1px solid var(--secondary-main);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .context-toggle {
    margin-left: auto;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .toggle-button:hover {
    background-color: rgba(63, 63, 70, 0.2); /* secondary-main with opacity */
  }

  .toggle-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 20px;
    text-align: center;
  }

  .toggle-track {
    width: 32px;
    height: 16px;
    border-radius: 8px;
    position: relative;
    transition: background-color 0.2s;
    background-color: var(--status-info) !important;
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .tooltip-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-number {
    font-size: 16px;
    font-weight: 700;
    color: var(--status-info);
  }

  .stat-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tooltip-topics {
    margin-bottom: 12px;
  }

  .topics-label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .topics-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .topic-tag {
    background: linear-gradient(135deg, var(--status-info) 0%, #64b5f6 100%);
    color: white;
    padding: 3px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .topic-more {
    color: var(--text-secondary);
    font-size: 10px;
    font-style: italic;
  }

  .tooltip-warning {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background-color: rgba(255, 193, 7, 0.1); /* warning with opacity */
    border: 1px solid rgba(255, 193, 7, 0.3); /* warning with opacity */
    border-radius: 6px;
    color: var(--status-warning);
    font-size: 11px;
  }
</style>