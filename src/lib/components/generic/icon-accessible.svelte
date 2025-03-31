<script lang="ts">
    export let name: string;
    export let iconSize: string = "md";
    export let className: string = "";
    export let onClick: (() => void) | null = null;
    
    // Determine if this icon is interactive
    const isInteractive = onClick !== null;
    
    function handleClick() {
        if (onClick) onClick();
    }
    
    function handleKeyDown(event: KeyboardEvent) {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
        }
    }
    
    const sizeClasses = {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8"
    };
    
    const sizeClass = sizeClasses[iconSize as keyof typeof sizeClasses] || sizeClasses.md;
</script>

{#if isInteractive}
    <div 
        role="button"
        tabindex="0"
        class="{sizeClass} {className} cursor-pointer"
        onclick={handleClick}
        onkeydown={handleKeyDown}
        aria-label={name}>
        <!-- Icon content goes here -->
        <slot />
    </div>
{:else}
    <div class="{sizeClass} {className}">
        <!-- Icon content goes here -->
        <slot />
    </div>
{/if}
