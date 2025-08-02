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
	class="group relative h-64 cursor-pointer overflow-hidden rounded-[12px] bg-[#1E1E1E] transition-all duration-300 {isActive
		? 'border border-[#8A2BE2] shadow-[0_4px_6px_rgba(138,43,226,0.1)]'
		: 'border border-[#4F4F4F] hover:border-[#8A2BE2] shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(138,43,226,0.1)]'} 
    hover:scale-[1.02]"
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
			class="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#8A2BE2] bg-[#2C2C2C] px-2 py-1"
		>
			<div class="h-2 w-2 animate-pulse rounded-full bg-[#8A2BE2]"></div>
			<span class="text-xs font-medium text-[#E0E0E0]">Active</span>
		</div>
	{/if}

	<!-- Delete button -->
	{#if isOwner && !showDeleteConfirm}
		<button
			type="button"
			onclick={handleDelete}
			class="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-[#F44336] bg-[#2C2C2C] text-[#F44336] opacity-0 transition-all hover:bg-[#F44336] hover:text-[#FFFFFF] group-hover:opacity-100"
			aria-label="Delete workspace"
		>
			<Icon name="delete" iconClass="w-4 h-4" />
		</button>
	{/if}

	<!-- Delete confirmation overlay -->
	{#if showDeleteConfirm}
		<div
			class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-[#121212] p-6"
			style="background-color: rgba(18, 18, 18, 0.95);"
		>
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#F44336] bg-[#2C2C2C]"
			>
				<Icon name="warning" iconClass="text-[#F44336] w-6 h-6" />
			</div>
			<h4 class="mb-2 text-center text-lg font-semibold text-[#E0E0E0]">Delete Workspace?</h4>
			<p class="mb-6 max-w-xs text-center text-sm text-[#B0B0B0]">
				This action cannot be undone. All conversations and data will be permanently removed.
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={cancelDelete}
					class="rounded-lg border border-[#4F4F4F] bg-[#2C2C2C] px-4 py-2 font-medium text-[#E0E0E0] transition-all hover:bg-[#3A3A3A]"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmDelete}
					class="rounded-lg bg-[#F44336] px-4 py-2 font-medium text-[#FFFFFF] shadow-lg transition-all hover:bg-[#D32F2F]"
				>
					Delete
				</button>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex h-full flex-col p-4">
		<!-- Header -->
		<div class="mb-4 flex-shrink-0 {isActive ? 'pt-8' : 'pt-2'}">
			<h3 class="mb-2 line-clamp-2 pr-8 text-xl font-bold text-[#E0E0E0]">{title}</h3>
			<p class="line-clamp-3 text-sm leading-relaxed text-[#B0B0B0]">
				{description || 'No description provided'}
			</p>
		</div>

		<!-- Footer -->
		<div class="mt-auto border-t border-[#4F4F4F] pt-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#8A2BE2] bg-[#3A3A3A]"
					>
						<Icon name="people" iconClass="text-[#8A2BE2] w-4 h-4" />
					</div>
					<span class="text-sm font-medium text-[#E0E0E0]">
						{collaboratorsCount}
						{collaboratorsCount === 1 ? 'member' : 'members'}
					</span>
				</div>

				{#if isOwner}
					<div
						class="flex items-center gap-1 rounded-[8px] border border-[#FFC107] bg-[#3A3A3A] px-2 py-1"
					>
						<Icon name="star" iconClass="text-[#FFC107] w-3 h-3" />
						<span class="text-xs font-medium text-[#FFC107]">Owner</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Hover effect overlay -->
	<div
		class="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-t from-[#121212] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-20"
	></div>
</div>
