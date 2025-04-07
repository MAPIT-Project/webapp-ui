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
  }
  
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
        const dateA = a.startDate ? new Date(a.startDate.split('/').reverse().join('-')).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate.split('/').reverse().join('-')).getTime() : 0;
        return dateB - dateA;
      }
    },
    { 
      id: 'date-asc', 
      label: 'Start date: Oldest first',
      compareFn: (a, b) => {
        const dateA = a.startDate ? new Date(a.startDate.split('/').reverse().join('-')).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate.split('/').reverse().join('-')).getTime() : 0;
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
    if (projects.length > 0) {
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
  $: visibleProjects = sortedProjects.slice(
    (currentPage - 1) * projectsPerPage, 
    currentPage * projectsPerPage
  );
  
  // Calculate total pages when projects change
  $: totalPages = Math.ceil(sortedProjects.length / projectsPerPage);
  
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
    selectedSortOption = sortOptions.find(option => option.id === optionId) || sortOptions[0];
  }
  
  // Navigation functions
  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    window.scrollTo({ top: document.getElementById('projects-section')?.offsetTop || 0, behavior: 'smooth' });
  }

  function goToPreviousPage() {
    if (currentPage > 1) goToPage(currentPage - 1);
  }

  function goToNextPage() {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  }
  
  // Calculate page numbers to display
  $: pageNumbers = calculatePageNumbers(currentPage, totalPages);
  
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
      // Fetch organization details
      const response = await fetch(`/api/organization/${orgId}`);
      if (!response.ok) {
        throw new Error(`Error fetching organization: ${response.statusText}`);
      }
      
      const data = await response.json();
      organization = data.organization;
      projects = data.projects || [];
      
      // Initial sort
      sortedProjects = [...projects].sort(selectedSortOption.compareFn);
      
      // Calculate total pages
      totalPages = Math.ceil(sortedProjects.length / projectsPerPage);
      
    } catch (err) {
      console.error("Error loading organization data:", err);
      error = err instanceof Error ? err.message : "Failed to load organization";
    } finally {
      loading = false;
    }
  });

  function goBack() {
    window.history.back();
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-5xl text-white">
  <!-- Back button -->
  <button 
    class="mb-6 flex items-center text-blue-400 hover:text-blue-300 transition"
    on:click={goBack}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
    </svg>
    Back to Map
  </button>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-700/30 border border-red-500 text-red-100 p-4 rounded-md">
      <h3 class="text-xl font-bold mb-2">Error</h3>
      <p>{error}</p>
    </div>
  {:else if organization}
    <!-- Organization Header -->
    <div class="bg-gray-800/50 rounded-lg shadow-lg p-6 mb-8">
      <h1 class="text-2xl font-bold mb-2">{organization.name}</h1>
      {#if organization.shortName}
        <p class="text-lg text-gray-300 mb-4">{organization.shortName}</p>
      {/if}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-gray-400">Organization ID:</p>
          <p class="text-xl font-mono mb-3">{organization.organisationID}</p>
          
          {#if organization.vatNumber}
            <p class="text-gray-400">VAT Number:</p>
            <p class="mb-3">{organization.vatNumber}</p>
          {/if}
          
          <p class="text-gray-400">Organization Type:</p>
          <p class="mb-3">{organization.activityType || "Not specified"}</p>
          
          {#if organization.SME !== undefined}
            <p class="text-gray-400">SME Status:</p>
            <p class="mb-3">{organization.SME ? "Yes" : "No"}</p>
          {/if}
          
          {#if organization.role}
            <p class="text-gray-400">Role:</p>
            <p class="mb-3">{organization.role}</p>
          {/if}
        </div>
        <div>
          <p class="text-gray-400">Address:</p>
          <p class="mb-1">{organization.street || ""}</p>
          <p class="mb-1">{organization.postCode || ""} {organization.city || ""}</p>
          <p class="mb-3">{organization.country || ""}</p>
          
          {#if organization.nutsCode}
            <p class="text-gray-400">NUTS Code:</p>
            <p class="mb-3">{organization.nutsCode}</p>
          {/if}
          
          {#if organization.ecContribution}
            <p class="text-gray-400">EC Contribution:</p>
            <p class="text-xl font-bold text-green-400 mb-3">€{formatNumber(organization.ecContribution)}</p>
          {/if}
          
          {#if organization.netEcContribution}
            <p class="text-gray-400">Net EC Contribution:</p>
            <p class="mb-3">€{formatNumber(organization.netEcContribution)}</p>
          {/if}
          
          {#if organization.totalCost}
            <p class="text-gray-400">Total Cost:</p>
            <p class="mb-3">€{formatNumber(organization.totalCost)}</p>
          {/if}
        </div>
      </div>
      
      <!-- External links -->
      <div class="mt-6 flex flex-wrap gap-4">
        {#if organization.organizationURL}
          <a 
            href={organization.organizationURL} 
            target="_blank" 
            rel="noopener noreferrer"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-flex items-center"
          >
            <span>Visit Website</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        {/if}
        
        {#if organization.contactForm}
          <a 
            href={organization.contactForm} 
            target="_blank" 
            rel="noopener noreferrer"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded inline-flex items-center"
          >
            <span>Contact Form</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        {/if}
      </div>
    </div>
    
    <!-- Related Projects Section -->
    {#if projects.length > 0}
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <h2 id="projects-section" class="text-xl font-bold">Related Projects ({projects.length})</h2>
        
        <!-- Sort options -->
        <div class="flex items-center">
          <label for="project-sort" class="mr-2 text-sm text-gray-400">Sort by:</label>
          <select 
            id="project-sort"
            class="bg-gray-700 border border-gray-600 text-white rounded-md text-sm px-3 py-1 focus:border-blue-500 focus:outline-none"
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
      
      <div class="space-y-4">
        {#each visibleProjects as project}
          <div class="bg-gray-800/40 rounded-lg shadow-md p-5 transition hover:bg-gray-800/60">
            <div class="flex justify-between">
              <h3 class="text-lg font-bold">
                {project.title}
                {#if project.acronym}
                  <span class="text-gray-400 ml-2">({project.acronym})</span>
                {/if}
              </h3>
              <div class="text-green-400 font-bold">
                €{formatNumber(project.contribution || 0)}
              </div>
            </div>
            
            {#if project.objective}
              <p class="text-gray-300 mt-2">{project.objective}</p>
            {/if}
            
            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {#if project.startDate || project.endDate}
                <div>
                  <span class="text-gray-400">Duration: </span>
                  {project.startDate || "N/A"} to {project.endDate || "N/A"}
                </div>
              {/if}
              
              {#if project.fundingScheme}
                <div>
                  <span class="text-gray-400">Funding: </span>
                  {project.fundingScheme}
                </div>
              {/if}
              
              {#if project.status}
                <div>
                  <span class="text-gray-400">Status: </span>
                  <span class={project.status === 'SIGNED' ? 'text-green-400' : 'text-yellow-400'}>
                    {project.status}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
        
        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex justify-center pt-6">
            <nav class="flex items-center space-x-1" aria-label="Pagination">
              <!-- Previous button -->
              <button
                on:click={goToPreviousPage}
                class="px-2.5 py-1.5 rounded-md bg-gray-700/60 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <!-- Page numbers -->
              {#each pageNumbers as pageNum}
                {#if pageNum === null}
                  <!-- Ellipsis -->
                  <span class="px-3 py-1.5 text-gray-400">...</span>
                {:else}
                  <button
                    on:click={() => goToPage(pageNum)}
                    class="px-3 py-1.5 rounded-md {pageNum === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-700/60 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'}"
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                {/if}
              {/each}
              
              <!-- Next button -->
              <button
                on:click={goToNextPage}
                class="px-2.5 py-1.5 rounded-md bg-gray-700/60 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white {currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
          <div class="text-center text-sm text-gray-400 mt-2">
            Page {currentPage} of {totalPages} ({(currentPage - 1) * projectsPerPage + 1}-{Math.min(currentPage * projectsPerPage, projects.length)} of {projects.length} projects)
          </div>
        {/if}
      </div>
    {:else}
      <div class="bg-gray-800/40 rounded-lg p-6 text-center">
        <p>No related projects found for this organization.</p>
      </div>
    {/if}
  {:else}
    <div class="bg-gray-800/40 rounded-lg p-6 text-center">
      <p>Organization not found</p>
    </div>
  {/if}
</div>
