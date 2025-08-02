<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getSpace,
		setSpace,
		getAllAvailableSpaces, // MODIFIED: Use the new getter function
		fetchUserCollaborations,
		getIsLoadingUserCollaborations
	} from '$lib/stores/collaborationStore.svelte';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/clients/supabaseClient';

	interface Props {
		onUpdateWidth: (width: number) => void;
	}

	const { onUpdateWidth }: Props = $props();

	let width: number = $state(250);
	let open: boolean = $state(false);

	// Space management
	let navigationEffectHasRunOnceAfterLoading = false;

	// Custom dropdown state
	let showSpaceDropdown = $state(false);
	let dropdownElement: HTMLDivElement | undefined = $state();

	onMount(() => {
		// Handle async initialization
		(async () => {
			const {
				data: { session: clientSession }
			} = await supabase.auth.getSession();
			if (!clientSession) {
				console.error('[Sidebar onMount] No active client-side session.');
			}
			// Fetch collaborations when the sidebar mounts
			await fetchUserCollaborations();
		})();

		// Close dropdown when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
				showSpaceDropdown = false;
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Use derived state from the store via the new getter
	let spaces = $derived(getAllAvailableSpaces()); // MODIFIED
	let isLoadingSpaces = $derived(getIsLoadingUserCollaborations());
	let currentSpace = $derived(getSpace());

	// Effect to ensure currentSpace is valid after spaces are loaded/updated
	$effect(() => {
		if (isLoadingSpaces) return;

		const spaceExists = spaces.find((s) => s.id === currentSpace);
		if (!spaceExists && currentSpace !== 'personal') {
			if (spaces.length > 0 && !spaces.find((s) => s.id === getSpace())) {
				setSpace('personal');
			}
		} else if (
			!spaceExists &&
			currentSpace === 'personal' &&
			spaces.length > 0 &&
			spaces[0].id !== 'personal'
		) {
			// This case might be redundant if 'personal' is always first and present
			// but kept for safety if store logic changes how 'personal' is added.
			setSpace(spaces[0].id);
		}
	});

	// Effect to navigate to /dashboard when currentSpace changes
	$effect(() => {
		const _cs = currentSpace; // Ensure currentSpace is a dependency of this effect

		if (isLoadingSpaces) {
			navigationEffectHasRunOnceAfterLoading = false;
			return;
		}

		if (!navigationEffectHasRunOnceAfterLoading) {
			navigationEffectHasRunOnceAfterLoading = true;
			return;
		}
		goto('/dashboard');
	});

	function handleSpaceChange(spaceId: string) {
		setSpace(spaceId);
		showSpaceDropdown = false;
	}

	function toggleDropdown() {
		showSpaceDropdown = !showSpaceDropdown;
	}

	function getCurrentSpaceName(): string {
		const space = spaces.find((s) => s.id === currentSpace);
		return space?.name || 'Personal';
	}

	function isPersonalSpace(spaceId: string): boolean {
		return spaceId === 'personal';
	}

	const handleResize = () => {
		open = !open;
		if (!open) {
			width = 250;
		} else {
			width = 65;
		}
		onUpdateWidth(width);
	};

	handleResize();

	const sideBarItems = [
		{
			name: 'Home',
			icon: 'home',
			url: '/'
		},
		{
			name: 'Conversations',
			icon: 'chat_bubble',
			url: '/conversations'
		},
		{
			name: 'Consortium',
			icon: 'public',
			url: '/consortium'
		},
		{
			name: 'Collaborations',
			icon: 'groups',
			url: '/collaborations'
		}
	];

	function isActive(url: string): boolean {
		if (url === '/') {
			return $page.url.pathname === '/dashboard';
		}
		return $page.url.pathname.includes(url);
	}

	const handleNavigation = (url: string) => {
		return (e: MouseEvent) => {
			e.preventDefault();
			goto(`/dashboard${url}`);
		};
	};
</script>

<div
	style="width: {width}px;"
	class="fixed left-0 top-0 h-screen transition-all {isPersonalSpace(currentSpace)
		? 'bg-gradient-to-b from-[#1A1A1A] via-[#161616] to-[#141414]'
		: 'bg-gradient-to-b from-[#1C1C1C] via-[#181818] to-[#161616]'} {open
		? 'flex flex-col items-center gap-10 p-3 pt-4'
		: 'p-5'} z-20 border-r border-gray-600/20 shadow-xl"
>
	{#if !open}
		<div class="flex flex-col gap-5">
			<div
				class="flex items-center justify-between rounded-xl p-4 {isPersonalSpace(currentSpace)
					? 'border border-[#404040]/15 bg-gradient-to-r from-[#2A2A2A]/30 to-[#2A2A2A]/20'
					: 'border border-[#404040]/15 bg-gradient-to-r from-[#2A2A2A]/30 to-[#2A2A2A]/20'} backdrop-blur-sm"
			>
				<h1
					class="text-4xl font-bold tracking-[0.17em] {isPersonalSpace(currentSpace)
						? 'text-gray-100'
						: 'text-gray-100'}"
				>
					MAPIT
				</h1>
				<button
					onclick={handleResize}
					class="flex h-8 w-8 items-center justify-center rounded p-1 text-[#F5F5F5] transition-colors hover:bg-white/10"
				>
					<Icon name="first_page" />
				</button>
			</div>

			<!-- Enhanced Space Selector -->
			<div class="space-selector relative" bind:this={dropdownElement}>
				{#if isLoadingSpaces}
					<!-- Loading State -->
					<div
						class="w-full cursor-not-allowed rounded-xl border border-[#404040]/50 bg-gradient-to-r from-[#2A2A2A]/60 to-[#2A2A2A]/60 p-3"
					>
						<div class="flex items-center gap-3">
							<div class="h-6 w-6 animate-pulse rounded-lg bg-gray-600/50"></div>
							<div class="flex-1">
								<div class="mb-1 h-3 animate-pulse rounded bg-gray-600/50"></div>
								<div class="h-2 w-20 animate-pulse rounded bg-gray-700/50"></div>
							</div>
							<div class="h-4 w-4 animate-pulse rounded bg-gray-600/50"></div>
						</div>
					</div>
				{:else if spaces.length > 0}
					<!-- Active Selector -->
					<button
						class="w-full {isPersonalSpace(currentSpace)
							? 'border border-[#404040]/30 bg-gradient-to-r from-[#2A2A2A]/50 to-[#2A2A2A]/40 hover:border-blue-500/20 hover:from-[#303030]/60 hover:to-[#303030]/50'
							: 'border border-[#404040]/30 bg-gradient-to-r from-[#2A2A2A]/50 to-[#2A2A2A]/40 hover:border-purple-500/20 hover:from-[#303030]/60 hover:to-[#303030]/50'} group rounded-xl p-3 text-left backdrop-blur-sm transition-all duration-200"
						onclick={toggleDropdown}
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<!-- Space Icon -->
								<div
									class="flex h-6 w-6 items-center justify-center rounded-lg {isPersonalSpace(
										currentSpace
									)
										? 'bg-gradient-to-r from-blue-500 to-blue-600'
										: 'bg-gradient-to-r from-purple-500 to-purple-600'} shadow-lg"
								>
									<Icon
										name={isPersonalSpace(currentSpace) ? 'person' : 'groups'}
										iconClass="text-white text-sm"
									/>
								</div>

								<!-- Space Details -->
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm font-medium text-white">{getCurrentSpaceName()}</div>
									<div class="text-xs font-medium text-gray-400">
										{isPersonalSpace(currentSpace) ? 'Personal workspace' : 'Team collaboration'}
									</div>
								</div>
							</div>

							<!-- Dropdown Arrow -->
							<div
								class="text-gray-400 transition-all duration-200 group-hover:text-gray-300 {showSpaceDropdown
									? 'rotate-180'
									: ''}"
							>
								<Icon name="expand_more" iconClass="w-4 h-4" />
							</div>
						</div>
					</button>

					<!-- Dropdown Menu -->
					{#if showSpaceDropdown}
						<div
							class="absolute left-0 right-0 top-full mt-2 border border-[#4F4F4F] bg-[#1E1E1E] z-50 overflow-hidden rounded-xl shadow-2xl backdrop-blur-sm"
						>
							<div class="space-y-1 p-2">
								{#each spaces as space (space.id)}
									<button
										class="group w-full rounded-lg p-3 text-left transition-all duration-200 hover:bg-[#4F4F4F] {currentSpace ===
										space.id
											? isPersonalSpace(space.id)
												? 'border border-blue-500/30 bg-blue-600/20'
												: 'border border-[#8A2BE2] bg-[#8A2BE2]/20'
											: 'border border-transparent'}"
										onclick={() => handleSpaceChange(space.id)}
									>
										<div class="flex items-center gap-3">
											<!-- Space Icon -->
											<div
												class="flex h-5 w-5 items-center justify-center rounded-md {isPersonalSpace(
													space.id
												)
													? 'bg-gradient-to-r from-blue-500 to-blue-600'
													: 'bg-[#8A2BE2]'} shadow-md"
											>
												<Icon
													name={isPersonalSpace(space.id) ? 'person' : 'groups'}
													iconClass="text-white text-xs"
												/>
											</div>

											<!-- Space Name -->
											<div class="min-w-0 flex-1">
												<div
													class="truncate text-sm font-medium {currentSpace === space.id
														? isPersonalSpace(space.id)
															? 'text-blue-100'
															: 'text-[#BB86FC]'
														: 'text-[#E0E0E0] group-hover:text-[#E0E0E0]'}"
												>
													{space.name}
												</div>
												<div class="text-xs text-[#B0B0B0]">
													{isPersonalSpace(space.id) ? 'Personal workspace' : 'Team collaboration'}
												</div>
											</div>

											<!-- Current Indicator -->
											{#if currentSpace === space.id}
												<div class="{isPersonalSpace(space.id) ? 'text-blue-400' : 'text-[#8A2BE2]'}">
													<Icon name="check" iconClass="w-4 h-4" />
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>

							<!-- Footer -->
							<div class="border-t border-[#4F4F4F] bg-[#2C2C2C] p-3">
								<a
									href="/dashboard/collaborations"
									class="flex items-center gap-2 text-xs font-medium text-[#B0B0B0] transition-colors {isPersonalSpace(currentSpace) ? 'hover:text-blue-400' : 'hover:text-[#BB86FC]'}"
									onclick={() => (showSpaceDropdown = false)}
								>
									<Icon name="add" iconClass="w-3 h-3" />
									Create or join workspace
								</a>
							</div>
						</div>
					{/if}
				{:else}
					<!-- No Spaces Available -->
					<div
						class="w-full rounded-xl border border-gray-600/50 bg-gradient-to-r from-gray-800/60 to-gray-700/60 p-3"
					>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-600/50">
								<Icon name="warning" iconClass="text-gray-400 text-sm" />
							</div>
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-300">No workspaces</div>
								<div class="text-xs text-gray-500">Create one to get started</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="mt-6 flex flex-col gap-1.5">
			{#each sideBarItems as item}
				<div
					class="w-full rounded-xl {isActive(item.url)
						? isPersonalSpace(currentSpace)
							? 'border border-blue-500/15 bg-gradient-to-r from-gray-800/50 to-gray-700/40'
							: 'border border-purple-500/15 bg-gradient-to-r from-gray-800/50 to-gray-700/40'
						: isPersonalSpace(currentSpace)
							? 'border border-transparent hover:border-blue-500/10 hover:bg-gray-800/30'
							: 'border border-transparent hover:border-purple-500/10 hover:bg-gray-800/30'} backdrop-blur-sm transition-all duration-200"
				>
					<a
						href={item.url}
						onclick={handleNavigation(item.url)}
						class="flex h-auto items-center gap-3.5 px-3.5 py-2.5 text-[#F5F5F5] no-underline"
					>
						<Icon name={item.icon} className="text-xl" />
						<span>{item.name}</span>
					</a>
				</div>
			{/each}
		</div>
	{:else}
		<img src="/images/mapit_logo_no_bg.png" class="size-8 object-contain" alt="MAPIT Logo" />

		<button
			onclick={handleResize}
			class="flex h-8 w-8 items-center justify-center rounded-lg p-1 text-[#F5F5F5] {isPersonalSpace(
				currentSpace
			)
				? 'border border-blue-500/10 hover:bg-gray-700/40'
				: 'border border-purple-500/10 hover:bg-gray-700/40'} backdrop-blur-sm transition-all"
		>
			<Icon name="last_page" />
		</button>

		<div class="mt-3 flex w-full flex-col gap-3">
			{#each sideBarItems as item}
				<a
					href={item.url}
					onclick={handleNavigation(item.url)}
					title={item.name}
					class="flex h-auto w-full items-center justify-center rounded-xl p-2 text-[#F5F5F5] no-underline {isActive(
						item.url
					)
						? isPersonalSpace(currentSpace)
							? 'border border-blue-500/15 bg-gray-800/50'
							: 'border border-purple-500/15 bg-gray-800/50'
						: isPersonalSpace(currentSpace)
							? 'border border-transparent hover:border-blue-500/10 hover:bg-gray-700/30'
							: 'border border-transparent hover:border-purple-500/10 hover:bg-gray-700/30'} backdrop-blur-sm transition-all duration-200"
				>
					<Icon name={item.icon} className="text-xl" />
				</a>
			{/each}
		</div>
	{/if}
</div>
