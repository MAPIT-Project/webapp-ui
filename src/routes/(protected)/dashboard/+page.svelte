<script lang="ts">
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { profileStore } from '$lib/stores/profileStore';
  
  let greeting = '';
  let isLoaded = false;
  
  // Get greeting based on time of day
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  
  onMount(() => {
    greeting = getGreeting();
    
    // Simulate loading for smooth animation
    setTimeout(() => {
      isLoaded = true;
    }, 100);
  });

  // Use only the first name from the profile store for a more personal greeting
  $: userName = $profileStore.loading ? 'User' : 
                $profileStore.firstName ? $profileStore.firstName :
                $profileStore.email?.split('@')[0] || 'User';
</script>

<div class="p-6 max-w-5xl mx-auto">
  {#if isLoaded}
    <div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
      <h1 class="text-3xl font-semibold">{greeting}, {userName}</h1>
      <p class="text-gray-400 mt-1">Welcome to your personal dashboard</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" in:scale={{ duration: 300, delay: 100, start: 0.95 }}>
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50 hover:border-[#565869]/50 transition-colors">
        <div class="flex items-center mb-4">
          <div class="bg-blue-500 p-3 rounded-lg mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-medium text-white">My Collaborations</h2>
            <p class="text-gray-400 text-sm">Work together with others</p>
          </div>
        </div>
        <a href="/dashboard/collaborations" class="inline-flex items-center justify-center w-full py-2 px-4 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
          View Collaborations
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
      
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50 hover:border-[#565869]/50 transition-colors">
        <div class="flex items-center mb-4">
          <div class="bg-purple-500 p-3 rounded-lg mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-medium text-white">My Conversations</h2>
            <p class="text-gray-400 text-sm">Ask questions to AI</p>
          </div>
        </div>
        <a href="/dashboard/conversations" class="inline-flex items-center justify-center w-full py-2 px-4 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
          View Conversations
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
    
    <div in:scale={{ duration: 300, delay: 200, start: 0.95 }}>
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50">
        <h2 class="text-xl font-medium text-white mb-4">Quick Tips</h2>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="flex-shrink-0 h-6 w-6 text-blue-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="ml-3 text-gray-300">
              Create a new collaboration to start working with team members on shared projects.
            </p>
          </div>
          <div class="flex items-start">
            <div class="flex-shrink-0 h-6 w-6 text-blue-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="ml-3 text-gray-300">
              Press <kbd class="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded-md">?</kbd> anywhere to view keyboard shortcuts.
            </p>
          </div>
          <div class="flex items-start">
            <div class="flex-shrink-0 h-6 w-6 text-blue-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="ml-3 text-gray-300">
              Check this dashboard regularly for updates and important notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex justify-center items-center h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {/if}
</div>

