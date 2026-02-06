<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/generic/modal.svelte';
	import Icon from '$lib/components/generic/icon.svelte';
	import type { CollaborationWithDetails } from '$lib/types/schema';
	import {
		createCollaboration,
		getUserCollaborations as fetchCollaborationsFromAPI,
		deleteCollaboration
	} from '$lib/clients/collaborationService';
	import {
		addCollaborationToStore,
		removeCollaborationFromStore,
		fetchUserCollaborations,
		setSpace,
		getSpace
	} from '$lib/stores/collaborationStore.svelte';
	import CollabTile from './components/collab-tile.svelte';

	let collaborations: CollaborationWithDetails[] = $state([]);
	let isModalOpen = $state(false);
	let isLoading = $state(true);
	let error: string | null = $state(null);
	let newTitle = $state('');
	let newDescription = $state('');
	let isCreating = $state(false);

	let _collabPageInit = false;
	$effect(() => {
		if (_collabPageInit) return;
		_collabPageInit = true;
		console.log('[COLLABORATIONS PAGE] $effect FIRED — loading collaborations');
		loadCollaborations();
	});

	async function loadCollaborations() {
		try {
			isLoading = true;
			error = null;
			const apiCollaborations = await fetchCollaborationsFromAPI();
			// Use the data as returned from API (collaboratorsCount is now included)
			collaborations = apiCollaborations;
			console.log('Collaborations loaded for page:', collaborations);
		} catch (err) {
			console.error('Error loading collaborations:', err);
			error = 'Failed to load collaborations. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function openModal() {
		newTitle = '';
		newDescription = '';
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		newTitle = '';
		newDescription = '';
	}

	async function addCollaboration() {
		if (!newTitle.trim()) return;

		try {
			isCreating = true;
			error = null;
			const newCollabData = await createCollaboration(
				newTitle.trim(),
				newDescription.trim() || null
			);

			if (newCollabData) {
				const enhancedCollaboration = {
					...newCollabData,
					collaboratorsCount: 1, // New collaboration starts with 1 member (the creator)
					client_collaboration: [{ role: 'owner' as const }]
				};
				collaborations = [enhancedCollaboration, ...collaborations];

				addCollaborationToStore(newCollabData);
				closeModal();
			} else {
				error = 'Failed to create collaboration. Please try again.';
			}
		} catch (err) {
			console.error('Error creating collaboration:', err);
			error = 'An error occurred while creating the collaboration.';
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteCollaboration(event: CustomEvent<{ id: string }>) {
		const { id } = event.detail;

		try {
			isLoading = true;
			error = null;

			const success = await deleteCollaboration(id);

			if (success) {
				collaborations = collaborations.filter((collab) => String(collab.id) !== id);
				removeCollaborationFromStore(id);
			} else {
				error = 'Failed to delete collaboration. You might not have permission.';
			}
		} catch (err) {
			console.error('Error deleting collaboration:', err);
			error = 'An error occurred while deleting the collaboration.';
		} finally {
			isLoading = false;
		}
	}

	function handleCollabClick(event: CustomEvent<{ id: string }>) {
		const { id } = event.detail;
		console.log('Collaboration clicked:', id);

		// Switch to this collaboration workspace
		setSpace(id);

		// Navigate to the dashboard for this collaboration
		goto('/dashboard');
	}

	function clearError() {
		error = null;
	}
</script>

<div class="min-h-screen p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header Section -->
		<div class="mb-12" in:scale={{ duration: 300, start: 0.95 }}>
			<div class="mb-4 flex items-center gap-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8A2BE2] shadow-lg"
				>
					<Icon name="groups" iconClass="text-[#FFFFFF] text-xl" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-[#E0E0E0]">
						Team Workspaces
					</h1>
					<p class="mt-1 text-lg text-[#B0B0B0]">Create and manage your collaborative projects</p>
				</div>
			</div>

			<!-- Stats and Quick Actions -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-6">
					<div class="flex items-center gap-2 text-gray-400">
						<Icon name="folder" iconClass="w-5 h-5" />
						<span class="font-medium text-[#E0E0E0]"
							>{collaborations.length} workspace{collaborations.length !== 1 ? 's' : ''}</span
						>
					</div>
					{#if collaborations.length > 0}
						<div class="flex items-center gap-2 text-gray-400">
							<Icon name="people" iconClass="w-5 h-5" />
							<span class="font-medium text-[#E0E0E0]"
								>{collaborations.reduce((sum, c) => sum + (c.collaboratorsCount || 1), 0)} total members</span
							>
						</div>
					{/if}
				</div>

				<button
					onclick={openModal}
					class="flex items-center gap-2 rounded-lg bg-[#8A2BE2] px-6 py-3 font-medium text-[#FFFFFF] shadow-lg transition-all hover:bg-[#A052E8]"
				>
					<Icon name="add" iconClass="w-5 h-5" />
					New Workspace
				</button>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
				<div
					class="rounded-lg border border-[#F44336] bg-[#1E1E1E] p-4 shadow-lg"
				>
					<div class="flex items-start gap-3">
						<Icon name="error" iconClass="text-[#F44336] w-5 h-5 mt-0.5" />
						<div class="flex-1">
							<p class="font-medium text-[#E0E0E0]">{error}</p>
						</div>
						<button onclick={clearError} class="text-[#F44336] transition-colors hover:text-[#F44336]/80">
							<Icon name="close" iconClass="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Content -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-4 xl:grid-cols-5">
			{#if isLoading}
				<!-- Loading Skeletons -->
				{#each Array(6) as _, i}
					<div
						class="h-64 animate-pulse rounded-[12px] border border-[#4F4F4F] bg-[#1E1E1E] p-4 shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
						in:scale={{ duration: 200, delay: i * 50, start: 0.95 }}
					>
						<div class="space-y-4">
							<div class="h-6 rounded-[8px] bg-[#3A3A3A]"></div>
							<div class="space-y-2">
								<div class="h-3 rounded bg-[#3A3A3A]"></div>
								<div class="h-3 w-3/4 rounded bg-[#3A3A3A]"></div>
								<div class="h-3 w-1/2 rounded bg-[#3A3A3A]"></div>
							</div>
							<div class="mt-auto border-t border-[#4F4F4F] pt-4">
								<div class="h-4 w-1/3 rounded bg-[#3A3A3A]"></div>
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<!-- Collaboration Tiles -->
				{#each collaborations as collab, i}
					<div in:scale={{ duration: 300, delay: i * 50, start: 0.95 }}>
						<CollabTile
							id={String(collab.id)}
							title={collab.name}
							description={collab.description}
							collaboratorsCount={collab.collaboratorsCount}
							isOwner={collab.client_collaboration?.some((cc) => cc.role === 'owner') ?? false}
							isActive={getSpace() === String(collab.id)}
							on:delete={handleDeleteCollaboration}
							on:click={handleCollabClick}
						/>
					</div>
				{/each}

				<!-- Create New Workspace Tile -->
				<div in:scale={{ duration: 300, delay: collaborations.length * 50, start: 0.95 }}>
					<button
						onclick={openModal}
						class="group flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#4F4F4F] bg-[#1E1E1E] shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-[#8A2BE2] hover:shadow-[0_4px_6px_rgba(138,43,226,0.1)]"
						aria-label="Create new workspace"
					>
						<div
							class="mb-4 flex h-16 w-16 items-center justify-center rounded-[8px] border border-[#8A2BE2] bg-[#1E1E1E] transition-transform group-hover:scale-110"
						>
							<Icon name="add" iconClass="text-[#8A2BE2] w-5.5 h-4" />
						</div>
						<span class="font-medium text-[#B0B0B0] transition-colors group-hover:text-[#8A2BE2]"
							>Create Workspace</span
						>
						<span class="mt-1 text-sm text-[#757575]">Start collaborating with your team</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Empty State -->
		{#if !isLoading && collaborations.length === 0}
			<div class="flex flex-col items-center justify-center py-16" in:fade={{ duration: 400 }}>
				<div
					class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-purple-600/20"
				>
					<Icon name="groups" iconClass="text-purple-400 w-12 h-12" />
				</div>
				<h2 class="mb-2 text-2xl font-semibold text-[#E0E0E0]">No workspaces yet</h2>
				<p class="mb-8 max-w-md text-center text-lg text-gray-400">
					Create your first workspace to start collaborating with your team on shared projects.
				</p>
				<button
					onclick={openModal}
					class="flex items-center gap-2 rounded-lg bg-[#8A2BE2] px-8 py-4 font-semibold text-[#FFFFFF] shadow-lg transition-all hover:bg-[#A052E8]"
				>
					<Icon name="add" iconClass="w-5 h-5" />
					Create Your First Workspace
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Enhanced Create Workspace Modal -->
<Modal
	bind:isOpen={isModalOpen}
	title="Create New Workspace"
	subtitle="Set up a collaborative space for your team"
	on:cancel={closeModal}
	closeOnEscape={true}
	background="bg-[#1E1E1E]"
>
	<div slot="content" class="flex w-full flex-col gap-6 p-6">
		<!-- Workspace Name -->
		<div class="flex flex-col gap-3">
			<label
				for="collab-title"
				class="flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]"
			>
				<Icon name="edit" iconClass="text-purple-400 w-4 h-4" />
				Workspace Name
			</label>
			<div class="relative">
				<input
					id="collab-title"
					class="w-full rounded-lg border border-[#4F4F4F] bg-[#2C2C2C] px-4 py-3 text-[#E0E0E0] placeholder-[#B0B0B0] transition-all focus:border-[#8A2BE2] focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
					placeholder="Enter a descriptive workspace name"
					bind:value={newTitle}
					maxlength={50}
					disabled={isCreating}
				/>
				{#if newTitle.length > 0}
					<div
						class="absolute right-3 top-3 rounded-full bg-[#3A3A3A] px-2 py-1 text-xs text-[#B0B0B0]"
					>
						{newTitle.length}/50
					</div>
				{/if}
			</div>
		</div>

		<!-- Workspace Description -->
		<div class="flex flex-col gap-3">
			<label for="collab-desc" class="flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]">
				<Icon name="description" iconClass="text-purple-400 w-4 h-4" />
				Description
			</label>
			<div class="relative">
				<textarea
					id="collab-desc"
					class="w-full resize-none rounded-lg border border-[#4F4F4F] bg-[#2C2C2C] px-4 py-3 text-[#E0E0E0] placeholder-[#B0B0B0] transition-all focus:border-[#8A2BE2] focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
					placeholder="Describe what this workspace is for and what your team will work on"
					bind:value={newDescription}
					maxlength={200}
					rows={4}
					disabled={isCreating}
				></textarea>
				{#if newDescription.length > 0}
					<div
						class="absolute bottom-3 right-3 rounded-full bg-[#3A3A3A] px-2 py-1 text-xs text-[#B0B0B0]"
					>
						{newDescription.length}/200
					</div>
				{/if}
			</div>
		</div>

		<!-- Info Box -->
		<div
			class="rounded-lg border border-[#8A2BE2] bg-[#1E1E1E] p-4"
		>
			<div class="flex items-start gap-3">
				<Icon name="info" iconClass="text-[#8A2BE2] w-5 h-5 mt-0.5" />
				<div class="text-sm leading-relaxed text-[#E0E0E0]">
					<p class="mb-1 font-medium text-[#8A2BE2]">About Workspaces</p>
					<p>
						Workspaces allow you to organize team projects with shared conversations, documents, and
						AI assistance. You can invite team members and collaborate in real-time.
					</p>
				</div>
			</div>
		</div>
	</div>

	<div slot="footer" class="flex justify-end gap-3 border-t border-[#2C2C2C] p-6">
		<button
			onclick={closeModal}
			class="rounded-lg border border-[#4F4F4F] px-6 py-2.5 font-medium text-[#B0B0B0] transition-all hover:border-[#757575] hover:bg-[#3A3A3A]"
			disabled={isCreating}
		>
			Cancel
		</button>
		<button
			onclick={addCollaboration}
			disabled={!newTitle.trim() || isCreating}
			class="flex items-center justify-center gap-2 rounded-lg bg-[#8A2BE2] px-6 py-2.5 font-medium text-[#FFFFFF] shadow-lg transition-all hover:bg-[#A052E8] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isCreating}
				<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
				Creating...
			{:else}
				<Icon name="add" iconClass="w-4 h-4" />
				Create Workspace
			{/if}
		</button>
	</div>
</Modal>
