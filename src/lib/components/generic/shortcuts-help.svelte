<script lang="ts">
	import { keyboardShortcuts, commonShortcuts } from '$lib/utils/keyboardShortcuts';
	import { onMount, onDestroy } from 'svelte';
	import Modal from '$lib/components/generic/modal.svelte';
	import { browser } from '$app/environment';

	let isOpen = false; // Change to local variable, not exported
	let shortcutsByCategory: Record<string, any[]> = {};
	let helpButtonElement: HTMLButtonElement;

	// Listen for the modal closing event
	function handleModalClose() {
		isOpen = false;
		// Reset focus after modal closes
		setTimeout(() => {
			if (helpButtonElement) {
				helpButtonElement.blur(); // Remove focus/highlight from button
			}
		}, 50);
	}

	// Listen for the toggle-shortcuts-help event
	function handleToggleShortcutsHelp() {
		isOpen = !isOpen;
		if (isOpen) {
			loadShortcuts(); // Reload shortcuts when modal is opened
		}
		console.log('Shortcuts help toggled:', isOpen);
	}

	function loadShortcuts() {
		// Ensure all common shortcuts are registered
		if (browser) {
			commonShortcuts.forEach((shortcut) => {
				keyboardShortcuts.register(shortcut);
			});

			// Get updated shortcuts from the manager
			shortcutsByCategory = keyboardShortcuts.getShortcutsByCategory();
			console.log('Shortcuts loaded:', shortcutsByCategory);
		}
	}

	onMount(() => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			console.log('Registering toggle-shortcuts-help event listener');
			document.addEventListener('toggle-shortcuts-help', handleToggleShortcutsHelp);

			// Load shortcuts initially
			loadShortcuts();
		}
	});

	onDestroy(() => {
		// Only remove event listeners in browser environment
		if (browser) {
			document.removeEventListener('toggle-shortcuts-help', handleToggleShortcutsHelp);
		}
	});

	function formatKey(key: string): string {
		return key
			.split('+')
			.map((part) => {
				if (part === 'ctrl') return 'Ctrl';
				if (part === 'alt') return 'Alt';
				if (part === 'shift') return 'Shift';
				if (part === 'meta') return 'Cmd';
				return part.charAt(0).toUpperCase() + part.slice(1);
			})
			.join(' + ');
	}

	// Handle the button click - ensure we don't just focus the button
	function handleButtonClick() {
		console.log('Button clicked - opening modal');
		isOpen = true; // Explicitly set to true instead of toggling
		loadShortcuts(); // Reload shortcuts when modal is opened
		if (helpButtonElement) {
			helpButtonElement.blur(); // Remove focus from button to prevent highlight
		}
	}
</script>

<!-- Visual indicator button that's always visible -->
<div>
	<button
		bind:this={helpButtonElement}
		class="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-0"
		on:mousedown|preventDefault={handleButtonClick}
		title="Keyboard shortcuts (press ? key)"
		aria-label="Keyboard shortcuts"
	>
		<span class="text-lg font-bold">?</span>
	</button>

	<Modal
		bind:isOpen
		title="Keyboard Shortcuts"
		subtitle="Boost your productivity with these shortcuts"
		on:cancel={handleModalClose}
		closeOnEscape={true}
		background="bg-[#1E1E1E]"
	>
		<div slot="content" class="max-h-96 overflow-y-auto pr-2 text-white">
			{#if Object.keys(shortcutsByCategory).length === 0}
				<p class="py-4 text-center text-gray-400">
					No keyboard shortcuts are currently registered.
				</p>
			{:else}
				{#each Object.entries(shortcutsByCategory) as [category, shortcuts]}
					<div class="mb-6">
						<h3 class="mb-3 text-lg font-medium text-gray-200">{category}</h3>
						<div class="overflow-hidden rounded-lg bg-[#2A2A2A]">
							<table class="min-w-full divide-y divide-[#444444]">
								<tbody class="divide-y divide-[#444444]">
									{#each shortcuts as shortcut}
										<tr>
											<td class="px-4 py-3 text-sm">
												<div class="flex flex-wrap gap-1">
													{#each formatKey(shortcut.key).split(' + ') as keyPart, i}
														<kbd
															class="rounded-md border border-[#565869] bg-[#343541] px-2 py-1 text-xs font-semibold text-gray-200"
														>
															{keyPart}
														</kbd>
														{#if i < formatKey(shortcut.key).split(' + ').length - 1}
															<span class="self-center text-gray-400">+</span>
														{/if}
													{/each}
												</div>
											</td>
											<td class="px-4 py-3 text-sm text-gray-300">
												{shortcut.description}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<div slot="footer" class="flex justify-end">
			<button
				class="rounded-md bg-[#343541] px-4 py-2 text-white hover:bg-[#444654] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				on:click={handleModalClose}
			>
				Close
			</button>
		</div>
	</Modal>
</div>
