<script lang="ts">
    import '../app.css';
    import Toast from '$lib/components/generic/toast.svelte';
    import ShortcutsHelp from '$lib/components/generic/shortcuts-help.svelte';
    import { keyboardShortcuts, commonShortcuts } from '$lib/utils/keyboardShortcuts';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    const { children } = $props();
    
    onMount(() => {
        // Only run browser-specific code in browser environment
        if (browser) {
            // Register common keyboard shortcuts
            commonShortcuts.forEach(shortcut => {
                keyboardShortcuts.register(shortcut);
            });
            
            // Install global keyboard listener
            keyboardShortcuts.installGlobalListener();
            
            return () => {
                // Clean up on component destruction
                keyboardShortcuts.removeGlobalListener();
            };
        }
    });
</script>

<div class="min-w-[100vw] min-h-screen bg-[#2B2A2C]">
    {@render children()}
    <Toast position="top-right" />
    <ShortcutsHelp />
</div>