<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Get the organization ID from the route parameter
	const orgId = $page.params.id;

	// Organization data
	let organization: any = null;
	let projects: any[] = [];
	let loading = true;
	let error: string | null = null;

	// Pagination
	const projectsPerPage = 5;
	let currentPage = 1;
	let totalPages = 1;

	// Sorting
	type SortOption = {
		id: string;
		label: string;
		compareFn: (a: any, b: any) => number;
	};

	const sortOptions: SortOption[] = [
		{
			id: 'contribution-desc',
			label: 'Contribution: Highest first',
			compareFn: (a, b) => (b.contribution || 0) - (a.contribution || 0)
		},
		{
			id: 'contribution-asc',
			label: 'Contribution: Lowest first',
			compareFn: (a, b) => (a.contribution || 0) - (b.contribution || 0)
		},
		{
			id: 'title-asc',
			label: 'Title: A to Z',
			compareFn: (a, b) => (a.title || '').localeCompare(b.title || '')
		},
		{
			id: 'title-desc',
			label: 'Title: Z to A',
			compareFn: (a, b) => (b.title || '').localeCompare(a.title || '')
		},
		{
			id: 'date-desc',
			label: 'Start date: Newest first',
			compareFn: (a, b) => {
				const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
				const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
				return dateB - dateA;
			}
		},
		{
			id: 'date-asc',
			label: 'Start date: Oldest first',
			compareFn: (a, b) => {
				const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
				const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
				return dateA - dateB;
			}
		},
		{
			id: 'status',
			label: 'Status',
			compareFn: (a, b) => (a.status || '').localeCompare(b.status || '')
		}
	];

	let selectedSortOption = sortOptions[0];
	let sortedProjects: any[] = [];

		// Apply sorting and maintain pagination
	$: {
		// When sort option or projects array changes, sort the projects
		if (projects && projects.length > 0) {
			sortedProjects = [...projects].sort(selectedSortOption.compareFn);
			// Go back to first page when sorting changes
			if (currentPage !== 1) {
				currentPage = 1;
			}
		} else {
			sortedProjects = [];
		}
	}

	// Get visible projects based on current page and sort
	$: visibleProjects = sortedProjects && sortedProjects.length > 0
		? sortedProjects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage)
		: [];

	// Calculate total pages when projects change
	$: totalPages = Math.ceil((sortedProjects?.length || 0) / projectsPerPage);

	// Format numbers with proper grouping
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-EU', {
			maximumFractionDigits: 0
		}).format(num);
	}

	// Handle sort change
	function handleSortChange(event: Event) {
		const selectElement = event.target as HTMLSelectElement;
		const optionId = selectElement.value;
		selectedSortOption = sortOptions.find((option) => option.id === optionId) || sortOptions[0];
	}

	// Navigation functions
	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		window.scrollTo({
			top: document.getElementById('projects-section')?.offsetTop || 0,
			behavior: 'smooth'
		});
	}

	function goToPreviousPage() {
		if (currentPage > 1) goToPage(currentPage - 1);
	}

	function goToNextPage() {
		if (totalPages && currentPage < totalPages) goToPage(currentPage + 1);
	}

	// Calculate page numbers to display
	$: pageNumbers = calculatePageNumbers(currentPage, totalPages || 1);

	// Function to calculate which page numbers to display in pagination
	function calculatePageNumbers(current: number, total: number) {
		const maxPagesToShow = 5;
		const pages = [];

		if (total <= maxPagesToShow) {
			// Show all pages if we have few
			for (let i = 1; i <= total; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Show ellipsis if needed
			if (current > 3) {
				pages.push(null); // null represents ellipsis
			}

			// Calculate range of page numbers to show around current page
			const startPage = Math.max(2, current - 1);
			const endPage = Math.min(total - 1, current + 1);

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}

			// Show ellipsis if needed
			if (current < total - 2) {
				pages.push(null); // null represents ellipsis
			}

			// Always show last page
			pages.push(total);
		}

		return pages;
	}

		onMount(async () => {
		try {
			console.log('Loading organization data for ID:', orgId);

			// Fetch organization details
			const response = await fetch(`/api/organization/${orgId}`);
			console.log('API response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API response error:', errorText);
				throw new Error(`Error fetching organization: ${response.statusText}`);
			}

			const data = await response.json();
			console.log('API response data received');

			organization = data.organization;
			projects = data.projects || [];

			console.log('Organization loaded:', organization?.name);
			console.log('Projects loaded:', projects?.length || 0);

			// Initial sort
			sortedProjects = [...projects].sort(selectedSortOption.compareFn);

			// Calculate total pages
			totalPages = Math.ceil(sortedProjects.length / projectsPerPage);
		} catch (err) {
			console.error('Error loading organization data:', err);
			error = err instanceof Error ? err.message : 'Failed to load organization';
		} finally {
			loading = false;
		}
	});

	function goBack() {
		window.history.back();
	}
</script>

<div class="min-h-screen bg-[#121212] text-[#E0E0E0] font-['Inter']" style="font-family: 'Inter', sans-serif;">
	<!-- Header with Back button -->
	<div class="border-b border-[#3A3A3A] bg-[#1E1E1E] px-6 py-4">
		<button
			class="flex items-center gap-2 text-[#B0B0B0] transition-colors hover:text-[#E0E0E0]"
			on:click={goBack}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			Back to Dashboard
		</button>
	</div>

	<div class="container mx-auto max-w-6xl p-6">

	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-2 border-[#8A2BE2] border-t-transparent"></div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-[#F44336]/10 border border-[#F44336]/20 p-6">
			<div class="flex items-center gap-3">
				<div class="h-2 w-2 rounded-full bg-[#F44336]"></div>
				<h3 class="text-lg font-semibold text-[#F44336]">Error</h3>
			</div>
			<p class="mt-2 text-[#E0E0E0]">{error}</p>
			<details class="mt-4">
				<summary class="text-[#B0B0B0] cursor-pointer hover:text-[#E0E0E0]">Debug Information</summary>
				<div class="mt-2 p-3 bg-[#1E1E1E] rounded text-xs font-mono">
					<p>Organization ID: {orgId}</p>
					<p>API URL: /api/organization/{orgId}</p>
					<p>Check browser console for more details</p>
				</div>
			</details>
		</div>
	{:else if organization}
		<!-- Organization Header -->
		<div class="mb-8 rounded-lg bg-[#1E1E1E] p-6 border border-[#3A3A3A]">
			<!-- Title Section -->
			<div class="mb-6">
				<h1 class="text-2xl font-bold text-[#E0E0E0] mb-2">{organization.name}</h1>
				{#if organization.shortName}
					<p class="text-[#B0B0B0] text-lg">{organization.shortName}</p>
				{/if}
			</div>

			<!-- Info Grid -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-6">
				<!-- Left Column -->
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
						<div>
							<p class="text-[#B0B0B0] text-sm font-medium">Organization ID</p>
							<p class="font-mono text-[#E0E0E0]">{organization.organisationID}</p>
						</div>
					</div>

					{#if organization.vatNumber}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">VAT Number</p>
								<p class="text-[#E0E0E0]">{organization.vatNumber}</p>
							</div>
						</div>
					{/if}

					<div class="flex items-center gap-3">
						<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
						<div>
							<p class="text-[#B0B0B0] text-sm font-medium">Organization Type</p>
							<p class="text-[#E0E0E0]">{organization.activityType || 'Not specified'}</p>
						</div>
					</div>

					{#if organization.SME !== undefined}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">SME Status</p>
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {organization.SME ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'bg-[#757575]/20 text-[#757575]'}">
									{organization.SME ? 'Yes' : 'No'}
								</span>
							</div>
						</div>
					{/if}

					{#if organization.role}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">Role</p>
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#8A2BE2]/20 text-[#8A2BE2]">
									{organization.role}
								</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Right Column -->
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="h-2 w-2 rounded-full bg-[#8A2BE2] mt-1"></div>
						<div>
							<p class="text-[#B0B0B0] text-sm font-medium">Address</p>
							<p class="text-[#E0E0E0]">{organization.street || ''}</p>
							<p class="text-[#E0E0E0]">{organization.postCode || ''} {organization.city || ''}</p>
							<p class="text-[#E0E0E0]">{organization.country || ''}</p>
						</div>
					</div>

					{#if organization.nutsCode}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#8A2BE2]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">NUTS Code</p>
								<p class="text-[#E0E0E0]">{organization.nutsCode}</p>
							</div>
						</div>
					{/if}

					{#if organization.ecContribution}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#4CAF50]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">EC Contribution</p>
								<p class="text-lg font-bold text-[#4CAF50]">€{formatNumber(organization.ecContribution)}</p>
							</div>
						</div>
					{/if}

					{#if organization.netEcContribution}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#4CAF50]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">Net EC Contribution</p>
								<p class="text-[#E0E0E0]">€{formatNumber(organization.netEcContribution)}</p>
							</div>
						</div>
					{/if}

					{#if organization.totalCost}
						<div class="flex items-center gap-3">
							<div class="h-2 w-2 rounded-full bg-[#4CAF50]"></div>
							<div>
								<p class="text-[#B0B0B0] text-sm font-medium">Total Cost</p>
								<p class="text-[#E0E0E0]">€{formatNumber(organization.totalCost)}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- External Links -->
			<div class="flex flex-wrap gap-3 pt-4 border-t border-[#3A3A3A]">
				{#if organization.organizationURL}
					<a
						href={organization.organizationURL}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8A2BE2] text-white hover:bg-[#A052E8] transition-colors font-medium"
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
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						Visit Website
					</a>
				{/if}

				{#if organization.contactForm}
					<a
						href={organization.contactForm}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 text-[#8A2BE2] hover:bg-[#8A2BE2]/30 transition-colors font-medium"
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
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						Contact Form
					</a>
				{/if}
			</div>
		</div>

		<!-- Related Projects Section -->
		{#if projects.length > 0}
			<!-- Section Header -->
			<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-3">
					<div class="h-3 w-3 rounded-full bg-[#8A2BE2]"></div>
					<h2 class="text-xl font-semibold text-[#E0E0E0]">
						Related Projects ({projects.length})
					</h2>
				</div>

				<!-- Sort options -->
				<div class="flex items-center gap-3">
					<label for="project-sort" class="text-sm font-medium text-[#B0B0B0]">Sort by:</label>
					<select
						id="project-sort"
						class="rounded-lg border border-[#3A3A3A] bg-[#2C2C2C] px-3 py-2 text-sm text-[#E0E0E0] focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2] transition-colors"
						on:change={handleSortChange}
					>
						{#each sortOptions as option}
							<option value={option.id} selected={option.id === selectedSortOption.id}>
								{option.label}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Projects Grid -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
				{#each visibleProjects as project}
					<div class="rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] p-5 hover:border-[#8A2BE2]/50 transition-colors group">
						<!-- Project Header -->
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-[#E0E0E0] group-hover:text-[#8A2BE2] transition-colors">
									{project.title}
								</h3>
								{#if project.acronym}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#8A2BE2]/20 text-[#8A2BE2] mt-1">
										{project.acronym}
									</span>
								{/if}
							</div>
							<div class="text-right">
								<div class="text-lg font-bold text-[#4CAF50]">
									€{formatNumber(project.contribution || 0)}
								</div>
								<div class="text-xs text-[#B0B0B0]">Contribution</div>
							</div>
						</div>

						<!-- Project Description -->
						{#if project.title}
							<p class="text-[#B0B0B0] text-sm leading-relaxed mb-4 line-clamp-3">
								{project.title}
							</p>
						{/if}

						<!-- Project Details Grid -->
						<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
							{#if project.startDate || project.endDate}
								<div class="flex items-center gap-2">
									<div class="h-1.5 w-1.5 rounded-full bg-[#8A2BE2]"></div>
									<div>
										<span class="text-[#B0B0B0]">Duration</span>
										<div class="text-[#E0E0E0]">
											{project.startDate || 'N/A'} to {project.endDate || 'N/A'}
										</div>
									</div>
								</div>
							{/if}


							{#if project.status}
								<div class="flex items-center gap-2">
									<div class="h-1.5 w-1.5 rounded-full bg-[#8A2BE2]"></div>
									<div>
										<span class="text-[#B0B0B0]">Status</span>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {project.status === 'SIGNED' ? 'bg-[#4CAF50]/20 text-[#4CAF50]' : 'bg-[#FFC107]/20 text-[#FFC107]'}">
											{project.status}
										</span>
									</div>
								</div>
							{/if}
						</div>

						<!-- Total Cost -->
						{#if project.totalCost}
							<div class="mt-4 pt-4 border-t border-[#3A3A3A]">
								<div class="flex justify-between items-center">
									<span class="text-[#B0B0B0] text-sm">Total Cost</span>
									<span class="text-[#E0E0E0] font-semibold">€{formatNumber(project.totalCost)}</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-8 flex flex-col items-center gap-4">
					<nav class="flex items-center gap-1" aria-label="Pagination">
						<!-- Previous button -->
						<button
							on:click={goToPreviousPage}
							class="flex items-center justify-center w-10 h-10 rounded-lg border border-[#3A3A3A] bg-[#2C2C2C] text-[#B0B0B0] hover:bg-[#8A2BE2] hover:text-white hover:border-[#8A2BE2] transition-colors {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
							disabled={currentPage === 1}
							aria-label="Previous page"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>

						<!-- Page numbers -->
						{#each pageNumbers as pageNum}
							{#if pageNum === null}
								<!-- Ellipsis -->
								<span class="px-3 py-2 text-[#B0B0B0]">...</span>
							{:else}
								<button
									on:click={() => goToPage(pageNum)}
									class="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors {pageNum === currentPage
										? 'bg-[#8A2BE2] text-white'
										: 'border border-[#3A3A3A] bg-[#2C2C2C] text-[#B0B0B0] hover:bg-[#8A2BE2]/20 hover:border-[#8A2BE2]'}"
									aria-current={pageNum === currentPage ? 'page' : undefined}
								>
									{pageNum}
								</button>
							{/if}
						{/each}

						<!-- Next button -->
						<button
							on:click={goToNextPage}
							class="flex items-center justify-center w-10 h-10 rounded-lg border border-[#3A3A3A] bg-[#2C2C2C] text-[#B0B0B0] hover:bg-[#8A2BE2] hover:text-white hover:border-[#8A2BE2] transition-colors {currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
							disabled={currentPage === totalPages}
							aria-label="Next page"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</nav>

					<!-- Page info -->
					<div class="text-center text-sm text-[#B0B0B0]">
						Page {currentPage} of {totalPages}
						<span class="text-[#E0E0E0] font-medium">
							({(currentPage - 1) * projectsPerPage + 1}-{Math.min(currentPage * projectsPerPage, projects.length)})
						</span>
						of {projects.length} projects
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- No Projects State -->
		<div class="rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] p-8 text-center">
			<div class="flex flex-col items-center gap-3">
				<div class="h-12 w-12 rounded-full bg-[#8A2BE2]/20 flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#8A2BE2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-[#E0E0E0]">No Projects Found</h3>
				<p class="text-[#B0B0B0] max-w-md">
					This organization doesn't have any associated projects in our database.
				</p>
			</div>
		</div>
	{/if}
{:else}
	<!-- Organization Not Found State -->
	<div class="rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] p-8 text-center">
		<div class="flex flex-col items-center gap-3">
			<div class="h-12 w-12 rounded-full bg-[#F44336]/20 flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#F44336]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-[#E0E0E0]">Organization Not Found</h3>
			<p class="text-[#B0B0B0] max-w-md">
				The organization you're looking for doesn't exist or may have been removed.
			</p>
		</div>
	</div>
{/if}
</div>
</div>
