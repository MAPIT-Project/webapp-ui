<script lang="ts">
  export let name = '';
  export let iconSize: 'small' | 'base' | 'large' = 'base';
  
  // Define size classes based on the iconSize prop
  const sizeClasses = {
    small: 'text-sm',
    base: 'text-base',
    large: 'text-xl'
  };

  // Get the appropriate size class
  const sizeClass = sizeClasses[iconSize] || sizeClasses.base;
</script>

<span class="material-icons {sizeClass} {$$props.class || ''}">
  {name}
</span>

<style>
  /* Ensure Material Icons are loaded */
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
</style>
