<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/generic/icon.svelte';

	interface Props {
		id: string;
		title: string;
		description: string | null;
		collaboratorsCount?: number;
		isOwner?: boolean;
		isActive?: boolean;
	}

	const {
		id,
		title,
		description,
		collaboratorsCount = 1,
		isOwner = false,
		isActive = false
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		delete: { id: string };
		click: { id: string };
	}>();

	// Correct Svelte 5 runes syntax
	let showDeleteConfirm = $state(false);

	function handleDelete(event: MouseEvent) {
		// Prevent the click from bubbling up to the parent div
		event.stopPropagation();
		event.preventDefault();
		showDeleteConfirm = true;
	}

	function confirmDelete(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		dispatch('delete', { id });
		showDeleteConfirm = false;
	}

	function cancelDelete(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		showDeleteConfirm = false;
	}

	function handleClick() {
		// Only dispatch the click event if we're not showing the delete confirmation
		if (!showDeleteConfirm) {
			dispatch('click', { id });
		}
	}
</script>

<div
	class="group relative h-64 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 {isActive
		? 'border-2 border-purple-500/50 bg-gradient-to-br from-purple-600/20 to-purple-700/20 shadow-lg shadow-purple-500/20'
		: 'border border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40 hover:border-gray-600/70'} 
    backdrop-blur-sm hover:scale-[1.02] hover:shadow-xl"
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}}
	role="button"
	tabindex="0"
	aria-label="Open workspace: {title}"
>
	<!-- Active indicator -->
	{#if isActive}
		<div
			class="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-2 py-1 backdrop-blur-sm"
		>
			<div class="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
			<span class="text-xs font-medium text-purple-300">Active</span>
		</div>
	{/if}

	<!-- Delete button -->
	{#if isOwner && !showDeleteConfirm}
		<button
			type="button"
			onclick={handleDelete}
			class="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
			aria-label="Delete workspace"
		>
			<Icon name="delete" iconClass="w-4 h-4" />
		</button>
	{/if}

	<!-- Delete confirmation overlay -->
	{#if showDeleteConfirm}
		<div
			class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-gray-900/95 p-6 backdrop-blur-sm"
		>
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/20"
			>
				<Icon name="warning" iconClass="text-red-400 w-6 h-6" />
			</div>
			<h4 class="mb-2 text-center text-lg font-semibold text-white">Delete Workspace?</h4>
			<p class="mb-6 max-w-xs text-center text-sm text-gray-400">
				This action cannot be undone. All conversations and data will be permanently removed.
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={cancelDelete}
					class="rounded-xl border border-gray-600/50 bg-gray-700/50 px-4 py-2 font-medium text-gray-300 transition-all hover:bg-gray-600/50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmDelete}
					class="rounded-xl bg-red-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:bg-red-700"
				>
					Delete
				</button>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex h-full flex-col p-6">
		<!-- Header -->
		<div class="mb-4 flex-shrink-0 {isActive ? 'pt-8' : 'pt-2'}">
			<h3 class="mb-2 line-clamp-2 pr-8 text-xl font-bold text-white">{title}</h3>
			<p class="line-clamp-3 text-sm leading-relaxed text-gray-400">
				{description || 'No description provided'}
			</p>
		</div>

		<!-- Footer -->
		<div class="mt-auto border-t border-gray-700/30 pt-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-purple-600/20"
					>
						<Icon name="people" iconClass="text-purple-400 w-4 h-4" />
					</div>
					<span class="text-sm font-medium text-gray-300">
						{collaboratorsCount}
						{collaboratorsCount === 1 ? 'member' : 'members'}
					</span>
				</div>

				{#if isOwner}
					<div
						class="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1"
					>
						<Icon name="star" iconClass="text-amber-400 w-3 h-3" />
						<span class="text-xs font-medium text-amber-400">Owner</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Hover effect overlay -->
	<div
		class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>
</div>
