<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { toasts, dismissToast, type Toast } from '$lib/stores/toastStore';

	// Position for the toast container
	export let position:
		| 'top-right'
		| 'top-left'
		| 'bottom-right'
		| 'bottom-left'
		| 'top-center'
		| 'bottom-center' = 'top-right';

	// Map positions to classes
	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-center': 'top-4 left-1/2 -translate-x-1/2',
		'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
	};

	// Get animation based on position
	function getAnimation(pos: typeof position) {
		if (pos.includes('top')) {
			return { y: -20 };
		} else if (pos.includes('bottom')) {
			return { y: 20 };
		} else if (pos.includes('left')) {
			return { x: -20 };
		} else {
			return { x: 20 };
		}
	}

	// Get toast icon based on type
	function getToastIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        `;
			case 'error':
				return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        `;
			case 'warning':
				return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        `;
			case 'info':
				return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        `;
			default:
				return '';
		}
	}

	// Get toast color based on type
	function getToastColor(type: Toast['type']) {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			case 'info':
				return 'bg-blue-50 border-blue-200 text-blue-800';
			default:
				return 'bg-gray-50 border-gray-200 text-gray-800';
		}
	}

	// Get icon color based on type
	function getIconColor(type: Toast['type']) {
		switch (type) {
			case 'success':
				return 'text-green-500';
			case 'error':
				return 'text-red-500';
			case 'warning':
				return 'text-yellow-500';
			case 'info':
				return 'text-blue-500';
			default:
				return 'text-gray-500';
		}
	}
</script>

<!-- Toast container -->
<div class="fixed z-50 w-full max-w-xs {positionClasses[position]} flex flex-col gap-2">
	{#each $toasts as toast (toast.id)}
		<div
			transition:fly={{ ...getAnimation(position), duration: 300 }}
			class="flex w-full items-center rounded-lg border p-4 shadow-md {getToastColor(toast.type)}"
		>
			<!-- Icon -->
			<div class="{getIconColor(toast.type)} mr-3 flex-shrink-0">
				{@html getToastIcon(toast.type)}
			</div>

			<!-- Content -->
			<div class="mr-2 flex-1">
				{#if toast.title}
					<h3 class="font-medium">{toast.title}</h3>
				{/if}
				<p class={toast.title ? 'text-sm' : ''}>{toast.message}</p>
			</div>

			<!-- Dismiss button -->
			{#if toast.dismissible}
				<button
					on:click={() => dismissToast(toast.id)}
					class="ml-auto flex-shrink-0 rounded-full p-1 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
					aria-label="Dismiss notification"
				>
					<svg
						class="h-4 w-4 opacity-60"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			{/if}
		</div>
	{/each}
</div>
