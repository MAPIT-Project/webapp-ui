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
			commonShortcuts.forEach((shortcut) => {
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

<div
	class="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
>
	{@render children()}
	<Toast position="top-right" />
	<!-- <ShortcutsHelp /> -->
</div>
