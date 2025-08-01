<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;
	export let ariaLabel: string | undefined = undefined;

	// Variant and size classes
	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
		outline:
			'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
	};

	const sizeClasses = {
		sm: 'text-sm px-3 py-1.5',
		md: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-2.5'
	};

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		click: MouseEvent;
	}>();

	// Handle click event
	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', event);
		}
	}
</script>

<button
	{type}
	class="rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 {variantClasses[
		variant
	]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''} {disabled || loading
		? 'cursor-not-allowed opacity-60'
		: 'cursor-pointer'}"
	on:click={handleClick}
	disabled={disabled || loading}
	aria-label={ariaLabel}
	{...$$restProps}
>
	{#if loading}
		<span
			class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			aria-hidden="true"
		></span>
	{/if}
	<slot />
</button>
