<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let name: string;
  export let className = '';
  export let iconClass = '';
  export let iconSize:
    | 'xs'
    | 'sm'
    | 'base'
    | ''
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | '8xl'
    | '9xl' = 'base';
  export let leadingSize: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'none' = '6';
  export let iconMargin = '';
  export let iconColor = '';
  export let fill = '0';
  export let opsz = '24';
  export let wght = '300';
  export let grad = '0';
  export let maxWidth = '';
  export let interactive = false; // New prop to indicate if the icon is interactive
  export let label = ''; // Accessible label for the icon
  
  const dispatch = createEventDispatcher();
  
  if (maxWidth === '') {
    switch (iconSize) {
      case 'xs': {
        maxWidth = '12px';
        break;
      }
      case 'sm': {
        maxWidth = '14px';
        break;
      }
      case 'base': {
        maxWidth = '18px';
        break;
      }
      case 'lg': {
        maxWidth = '18px';
        break;
      }
      case 'xl': {
        maxWidth = '24px';
        break;
      }
      case '2xl': {
        maxWidth = '30px';
        break;
      }
      case '3xl': {
        maxWidth = '36px';
        break;
      }
      default: {
        maxWidth = '18px';
        break;
      }
    }
  }

  $: formattedName = name.replace(/-/g, '_').replace(/ /g, '_').toLowerCase();
  
  // Handle keyboard events for accessibility
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch('click');
    }
  }
</script>

{#if interactive}
  <!-- Interactive version with button semantics -->
  <button
    type="button"
    style="font-variation-settings: 'FILL' {fill}, 'wght' {wght}, 'GRAD' {grad}, 'opsz' {opsz};max-width: {maxWidth};"
    class={className}
    on:click
    on:keydown={handleKeyDown}
    aria-label={label || formattedName}
  >
    <i
      class="material-icons material-symbols-outlined text-{iconSize} leading-{leadingSize} text-{iconColor} {iconMargin} flex items-center justify-center {iconClass}"
    >
      {formattedName}
    </i>
  </button>
{:else}
  <!-- Non-interactive version (decorative) -->
  <span
    style="font-variation-settings: 'FILL' {fill}, 'wght' {wght}, 'GRAD' {grad}, 'opsz' {opsz};max-width: {maxWidth};"
    class={className}
    aria-hidden={!label}
    role={label ? "img" : undefined}
    aria-label={label || undefined}
  >
    <i
      class="material-icons material-symbols-outlined text-{iconSize} leading-{leadingSize} text-{iconColor} {iconMargin} flex items-center justify-center {iconClass}"
    >
      {formattedName}
    </i>
  </span>
{/if}