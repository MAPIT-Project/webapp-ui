<script lang="ts">
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { profileStore } from '$lib/stores/profileStore';
	import { getSpace } from '$lib/stores/collaborationStore.svelte';
	import Modal from '$lib/components/generic/modal.svelte';

	let isLoaded = $state(false);
	let currentTeam = 'Marketing Team';
	let members = $state<any[]>([]);
	let collaborationName = $state<string>('');
	let isLoadingMembers = $state(false);
	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state('member');
	let isInviting = $state(false);
	let inviteError = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	let activities = [
		{
			id: 1,
			user: 'Alex Morgan',
			action: 'created a new document',
			time: '2 hours ago',
			type: 'document'
		},
		{
			id: 2,
			user: 'Jamie Lee',
			action: 'commented on your design',
			time: 'Yesterday',
			type: 'comment'
		},
		{ id: 3, user: 'Taylor Kim', action: 'shared code snippets', time: '2 days ago', type: 'code' },
		{
			id: 4,
			user: 'Sam Chen',
			action: 'updated project timeline',
			time: '3 days ago',
			type: 'update'
		}
	];

	onMount(() => {
		// Simulate loading for smooth animation
		setTimeout(() => {
			isLoaded = true;
			loadCollaborationDetails();
			loadMembers();
		}, 100);
	});

	async function loadCollaborationDetails() {
		try {
			const spaceId = getSpace();
			if (spaceId !== 'personal') {
				const response = await fetch(`/api/collaborations?id=${spaceId}`);
				if (response.ok) {
					const data = await response.json();
					collaborationName = data.collaboration?.name || `Collaboration ${spaceId}`;
				} else {
					console.error('Failed to load collaboration details');
					collaborationName = `Collaboration ${spaceId}`;
				}
			}
		} catch (error) {
			console.error('Error loading collaboration details:', error);
			const spaceId = getSpace();
			collaborationName = `Collaboration ${spaceId}`;
		}
	}

	async function loadMembers() {
		isLoadingMembers = true;
		try {
			const spaceId = getSpace();
			if (spaceId !== 'personal') {
				const response = await fetch(`/api/collaborations/${spaceId}/members`);
				if (response.ok) {
					const data = await response.json();
					members = data.members;
				} else {
					console.error('Failed to load members');
					// Fallback to dummy data if API fails
					members = [
						{
							id: 1,
							name: 'Alex Morgan',
							role: 'Team Lead',
							avatar: 'https://i.pravatar.cc/150?img=1'
						},
						{
							id: 2,
							name: 'Jamie Lee',
							role: 'Designer',
							avatar: 'https://i.pravatar.cc/150?img=2'
						},
						{
							id: 3,
							name: 'Taylor Kim',
							role: 'Developer',
							avatar: 'https://i.pravatar.cc/150?img=3'
						},
						{ id: 4, name: 'Sam Chen', role: 'Analyst', avatar: 'https://i.pravatar.cc/150?img=4' }
					];
				}
			}
		} catch (error) {
			console.error('Error loading members:', error);
			// Fallback to dummy data if network error
			members = [
				{
					id: 1,
					name: 'Alex Morgan',
					role: 'Team Lead',
					avatar: 'https://i.pravatar.cc/150?img=1'
				},
				{ id: 2, name: 'Jamie Lee', role: 'Designer', avatar: 'https://i.pravatar.cc/150?img=2' },
				{ id: 3, name: 'Taylor Kim', role: 'Developer', avatar: 'https://i.pravatar.cc/150?img=3' },
				{ id: 4, name: 'Sam Chen', role: 'Analyst', avatar: 'https://i.pravatar.cc/150?img=4' }
			];
		} finally {
			isLoadingMembers = false;
		}
	}

	function openInviteModal() {
		showInviteModal = true;
		inviteEmail = '';
		inviteRole = 'member';
		inviteError = null;
	}

	function closeInviteModal() {
		showInviteModal = false;
		inviteEmail = '';
		inviteRole = 'member';
		inviteError = null;
	}

	async function handleInvite(event: Event) {
		event.preventDefault();

		if (!inviteEmail.trim()) {
			inviteError = 'Please enter an email address';
			return;
		}

		if (!inviteEmail.includes('@')) {
			inviteError = 'Please enter a valid email address';
			return;
		}

		isInviting = true;
		inviteError = null;

		try {
			const spaceId = getSpace();
			const response = await fetch(`/api/collaborations/${spaceId}/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: inviteEmail.trim(),
					role: inviteRole
				})
			});

			const data = await response.json();

			if (response.ok) {
				// Success - add member to list and show toast
				members = [
					...members,
					{
						id: data.member.id,
						name: `${data.member.firstName} ${data.member.lastName}`,
						email: data.member.email,
						role: data.member.role,
						avatar: `https://i.pravatar.cc/150?u=${data.member.email}`
					}
				];

				closeInviteModal();
				showToast(data.message, 'success');
			} else {
				inviteError = data.error || 'Failed to invite user';
			}
		} catch (error) {
			console.error('Error inviting user:', error);
			inviteError = 'Network error. Please try again.';
		} finally {
			isInviting = false;
		}
	}

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;

		// Clear toast after 5 seconds
		setTimeout(() => {
			toastMessage = null;
		}, 5000);
	}

	function clearToast() {
		toastMessage = null;
	}

	// Get user initials for avatar (similar to collaboration chat)
	function getUserInitials(member: any): string {
		if (!member) return 'U';
		const firstInitial = member.firstName?.[0] || '';
		const lastInitial = member.lastName?.[0] || '';
		return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
	}

	// Get display name for a user
	function getUserDisplayName(member: any): string {
		if (!member) return 'Unknown User';
		const displayName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
		return displayName || 'Unknown User';
	}

	// Get background color for avatar (similar to collaboration chat)
	function getAvatarBackground(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-purple-500',
			'bg-green-500',
			'bg-orange-500',
			'bg-pink-500',
			'bg-indigo-500',
			'bg-red-500',
			'bg-teal-500'
		];
		return colors[index % colors.length];
	}
</script>

<div class="mx-auto max-w-5xl p-6 pb-12">
	{#if isLoaded}
		<div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
			<h1 class="text-3xl font-semibold">Collaboration Space: {collaborationName || getSpace()}</h1>
			<p class="mt-1 text-gray-400">Manage your team and collaborate effectively</p>
		</div>

		<!-- Team Members Section -->
		<div in:scale={{ duration: 300, delay: 100, start: 0.95 }}>
			<div class="mb-8 rounded-lg border border-[#444654]/50 bg-[#343541] p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-medium text-white">Team Members ({members.length})</h2>
					<button
						onclick={openInviteModal}
						class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						Invite Member
					</button>
				</div>

				{#if isLoadingMembers}
					<div class="flex justify-center py-8">
						<div
							class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"
						></div>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						{#each members as member, index}
							<div
								class="rounded-lg border border-[#444654]/50 bg-[#2a2b35] p-4 transition-colors hover:bg-[#34353f]"
							>
								<div class="flex items-center">
									<div class="relative mr-3">
										<!-- Avatar with user initials -->
										<div
											class="h-12 w-12 rounded-full {getAvatarBackground(
												index
											)} flex items-center justify-center shadow-lg"
										>
											<span class="text-sm font-semibold text-white">
												{getUserInitials(member)}
											</span>
										</div>
										<!-- Online status indicator -->
										<div
											class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#2a2b35] bg-green-500"
										></div>
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-white">
											{getUserDisplayName(member)}
										</p>
										<p class="text-xs capitalize text-gray-400">{member.role}</p>
										<p class="truncate text-xs text-gray-500">{member.email}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Current Projects and Activity Section -->
		<div
			class="grid grid-cols-1 gap-6 lg:grid-cols-3"
			in:scale={{ duration: 300, delay: 150, start: 0.95 }}
		>
			<!-- Quick Actions -->
			<div class="rounded-lg border border-[#444654]/50 bg-[#343541] p-6 shadow-md">
				<h2 class="mb-4 text-xl font-medium text-white">Quick Actions</h2>
				<div class="space-y-3">
					<button
						class="flex w-full items-center rounded-md bg-[#444654] px-3 py-2 text-white transition-colors hover:bg-[#565869]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						New Document
					</button>

					<button
						class="flex w-full items-center rounded-md bg-[#444654] px-3 py-2 text-white transition-colors hover:bg-[#565869]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Schedule Meeting
					</button>

					<button
						class="flex w-full items-center rounded-md bg-[#444654] px-3 py-2 text-white transition-colors hover:bg-[#565869]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						View Analytics
					</button>
				</div>
			</div>

			<!-- Team Activity -->
			<div class="rounded-lg border border-[#444654]/50 bg-[#343541] p-6 shadow-md lg:col-span-2">
				<h2 class="mb-4 text-xl font-medium text-white">Recent Activity</h2>
				<div class="space-y-4">
					{#each activities as activity}
						<div class="rounded-md border border-[#444654]/30 bg-[#2a2b35] p-3">
							<div class="flex items-start">
								<div class="mt-1 flex-shrink-0">
									{#if activity.type === 'document'}
										<div class="rounded-md bg-blue-500/20 p-2 text-blue-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
									{:else if activity.type === 'comment'}
										<div class="rounded-md bg-green-500/20 p-2 text-green-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
												/>
											</svg>
										</div>
									{:else if activity.type === 'code'}
										<div class="rounded-md bg-purple-500/20 p-2 text-purple-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
												/>
											</svg>
										</div>
									{:else}
										<div class="rounded-md bg-yellow-500/20 p-2 text-yellow-400">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
												/>
											</svg>
										</div>
									{/if}
								</div>
								<div class="ml-3 flex-1">
									<p class="text-gray-300">
										<span class="font-medium text-white">{activity.user}</span>
										{activity.action}
									</p>
									<p class="mt-1 text-xs text-gray-500">{activity.time}</p>
								</div>
							</div>
						</div>
					{/each}

					<a
						href="/dashboard/activity"
						class="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[#444654] px-4 py-2 text-white transition-colors hover:bg-[#565869]"
					>
						View All Activity
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<!-- Shared Resources Section -->
		<div class="mt-8" in:scale={{ duration: 300, delay: 200, start: 0.95 }}>
			<div class="rounded-lg border border-[#444654]/50 bg-[#343541] p-6 shadow-md">
				<h2 class="mb-4 text-xl font-medium text-white">Shared Resources</h2>
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead class="border-b border-[#444654]/50">
							<tr>
								<th class="px-4 py-3 text-left font-medium text-gray-400">Name</th>
								<th class="px-4 py-3 text-left font-medium text-gray-400">Type</th>
								<th class="px-4 py-3 text-left font-medium text-gray-400">Owner</th>
								<th class="px-4 py-3 text-left font-medium text-gray-400">Modified</th>
								<th class="px-4 py-3 text-left font-medium text-gray-400">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#444654]/30">
							<tr>
								<td class="px-4 py-3 text-white">Project Brief</td>
								<td class="px-4 py-3 text-gray-300">Document</td>
								<td class="px-4 py-3 text-gray-300">Alex Morgan</td>
								<td class="px-4 py-3 text-gray-300">1 day ago</td>
								<td class="px-4 py-3">
									<button class="text-blue-400 hover:text-blue-300">Open</button>
								</td>
							</tr>
							<tr>
								<td class="px-4 py-3 text-white">Design Assets</td>
								<td class="px-4 py-3 text-gray-300">Folder</td>
								<td class="px-4 py-3 text-gray-300">Jamie Lee</td>
								<td class="px-4 py-3 text-gray-300">3 days ago</td>
								<td class="px-4 py-3">
									<button class="text-blue-400 hover:text-blue-300">Open</button>
								</td>
							</tr>
							<tr>
								<td class="px-4 py-3 text-white">Meeting Notes</td>
								<td class="px-4 py-3 text-gray-300">Document</td>
								<td class="px-4 py-3 text-gray-300">Taylor Kim</td>
								<td class="px-4 py-3 text-gray-300">1 week ago</td>
								<td class="px-4 py-3">
									<button class="text-blue-400 hover:text-blue-300">Open</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="mt-4 flex justify-end">
					<button
						class="inline-flex items-center rounded-md bg-[#444654] px-4 py-2 text-white transition-colors hover:bg-[#565869]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						Add Resource
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-[60vh] items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
		</div>
	{/if}
</div>

<!-- Invite Member Modal -->
<Modal
	bind:isOpen={showInviteModal}
	title="Invite Team Member"
	subtitle="Add a new member to your collaboration"
	on:cancel={closeInviteModal}
	closeOnEscape={true}
	background="bg-[#1E1E1E]"
>
	<div slot="content" class="flex w-full flex-col gap-6 p-4">
		{#if inviteError}
			<div class="rounded-md border border-red-800 bg-red-900/20 p-3">
				<p class="text-sm text-red-300">{inviteError}</p>
			</div>
		{/if}

		<div class="flex flex-col gap-3">
			<label for="inviteEmail" class="text-sm font-medium text-gray-300">Email Address</label>
			<input
				type="email"
				id="inviteEmail"
				bind:value={inviteEmail}
				placeholder="colleague@company.com"
				class="w-full rounded-md border border-[#444444] bg-[#2A2A2A] px-4 py-2.5 text-white transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
				disabled={isInviting}
				required
			/>
		</div>

		<div class="flex flex-col gap-3">
			<label for="inviteRole" class="text-sm font-medium text-gray-300">Role</label>
			<select
				id="inviteRole"
				bind:value={inviteRole}
				class="w-full rounded-md border border-[#444444] bg-[#2A2A2A] px-4 py-2.5 text-white transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/70"
				disabled={isInviting}
			>
				<option value="member">Member</option>
				<option value="admin">Admin</option>
			</select>
		</div>

		<div class="mt-2 rounded-md border border-[#444444] bg-[#343541]/30 p-4">
			<div class="flex items-start gap-3">
				<div class="mt-1 shrink-0">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-blue-400"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<p class="text-sm text-gray-300">
					Enter the email address of someone who already has an account. They will be added to this
					collaboration immediately.
				</p>
			</div>
		</div>
	</div>

	<div slot="footer" class="flex justify-end gap-3">
		<button
			onclick={closeInviteModal}
			class="rounded-md border border-[#444444] px-4 py-2.5 font-medium text-gray-300 transition-colors duration-200 hover:bg-[#2A2A2A]"
			disabled={isInviting}
		>
			Cancel
		</button>
		<button
			onclick={handleInvite}
			disabled={!inviteEmail.trim() || isInviting}
			class="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isInviting}
				<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
				Inviting...
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
					/>
				</svg>
				Invite Member
			{/if}
		</button>
	</div>
</Modal>

<!-- Toast Notification -->
{#if toastMessage}
	<div class="fixed right-4 top-4 z-50 max-w-sm">
		<div
			class="bg-{toastType === 'success' ? 'green' : 'red'}-900 border border-{toastType ===
			'success'
				? 'green'
				: 'red'}-700 text-{toastType === 'success'
				? 'green'
				: 'red'}-100 rounded-lg px-4 py-3 shadow-lg"
		>
			<div class="flex items-center justify-between">
				<p class="text-sm">{toastMessage}</p>
				<button
					onclick={clearToast}
					class="ml-3 text-{toastType === 'success' ? 'green' : 'red'}-300 hover:text-{toastType ===
					'success'
						? 'green'
						: 'red'}-100"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
