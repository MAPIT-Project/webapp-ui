<script lang="ts">
  import type { StreamingMessage } from '$lib/stores/streamingConversationStore';
  import { marked } from 'marked';
  
  export let message: StreamingMessage;
  export let isStreaming: boolean = false;
  
  $: formattedText = message.sender === 'ai' ? marked(message.text) : message.text;
  $: timestamp = new Date(message.timestamp).toLocaleTimeString();
</script>

<div class="message-bubble" class:user={message.sender === 'user'} class:ai={message.sender === 'ai'} class:system={message.sender === 'system'}>
  <div class="message-header">
    <span class="sender">
      {#if message.sender === 'user'}
        👤 You
      {:else if message.sender === 'ai'}
        🤖 AI Assistant
      {:else}
        ℹ️ System
      {/if}
    </span>
    <span class="timestamp">{timestamp}</span>
  </div>
  
  <div class="message-content">
    {#if message.sender === 'ai'}
      {@html formattedText}
    {:else}
      {message.text}
    {/if}
    
    {#if isStreaming}
      <span class="cursor">|</span>
    {/if}
  </div>
</div>

<style>
  .message-bubble {
    max-width: 80%;
    word-break: break-word;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    animation: slideIn 0.3s ease-out;
  }
  
  .message-bubble.user {
    align-self: flex-end;
    background: #8A2BE2; /* palette.accent.main */
    color: #FFFFFF; /* palette.accent.contrastText */
    margin-left: auto;
  }
  
  .message-bubble.ai {
    align-self: flex-start;
    background: #1E1E1E; /* palette.primary.surface */
    border: 1px solid #3A3A3A; /* palette.secondary.main */
    color: #E0E0E0; /* palette.text.primary */
    max-width: 70ch;
  }
  
  .message-bubble.system {
    align-self: center;
    background: #2C2C2C; /* palette.secondary.dark */
    border: 1px solid #4F4F4F; /* palette.secondary.light */
    color: #B0B0B0; /* palette.text.secondary */
    font-style: italic;
    text-align: center;
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    opacity: 0.8;
  }
  
  .sender {
    font-weight: 600;
  }
  
  .timestamp {
    font-size: 0.75rem;
  }
  
  .message-content {
    line-height: 1.5;
    position: relative;
    overflow-wrap: anywhere;
  }
  
  .cursor {
    animation: blink 1s infinite;
    font-weight: bold;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  /* Style markdown content in AI messages */
  .message-bubble.ai :global(h1),
  .message-bubble.ai :global(h2),
  .message-bubble.ai :global(h3) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #E0E0E0; /* palette.text.primary */
  }
  
  .message-bubble.ai :global(p) {
    margin-bottom: 0.75rem;
    color: #E0E0E0; /* palette.text.primary */
  }
  
  .message-bubble.ai :global(ul),
  .message-bubble.ai :global(ol) {
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
    color: #E0E0E0; /* palette.text.primary */
  }
  
  .message-bubble.ai :global(a) {
    color: #BB86FC; /* palette.text.link */
    text-decoration: none;
  }
  
  .message-bubble.ai :global(a:hover) {
    text-decoration: underline;
  }
  
  .message-bubble.ai :global(code) {
    background: #2C2C2C; /* palette.secondary.dark */
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    color: #E0E0E0; /* palette.text.primary */
  }
</style>