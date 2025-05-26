<script lang="ts">
  import { onMount } from 'svelte';
  import { scale, fade } from 'svelte/transition';
  import { profileStore } from '$lib/stores/profileStore';
  import { getSpace } from '$lib/stores/collaborationStore.svelte';
  
  let isLoaded = $state(false); // Changed to $state
  let currentTeam = "Marketing Team";
  let members = [
    { id: 1, name: "Alex Morgan", role: "Team Lead", avatar: "https://i.pravatar.cc/150?img=1" },
    { id: 2, name: "Jamie Lee", role: "Designer", avatar: "https://i.pravatar.cc/150?img=2" },
    { id: 3, name: "Taylor Kim", role: "Developer", avatar: "https://i.pravatar.cc/150?img=3" },
    { id: 4, name: "Sam Chen", role: "Analyst", avatar: "https://i.pravatar.cc/150?img=4" }
  ];
  
  let activities = [
    { id: 1, user: "Alex Morgan", action: "created a new document", time: "2 hours ago", type: "document" },
    { id: 2, user: "Jamie Lee", action: "commented on your design", time: "Yesterday", type: "comment" },
    { id: 3, user: "Taylor Kim", action: "shared code snippets", time: "2 days ago", type: "code" },
    { id: 4, user: "Sam Chen", action: "updated project timeline", time: "3 days ago", type: "update" }
  ];
  
  onMount(() => {
    // Simulate loading for smooth animation
    setTimeout(() => {
      isLoaded = true;
    }, 100);
  });
</script>

<div class="p-6 max-w-5xl mx-auto">
  {#if isLoaded}
    <div class="mb-8" in:scale={{ duration: 300, start: 0.95 }}>
      <h1 class="text-3xl font-semibold">Collaboration Space: {getSpace()}</h1>
      <p class="text-gray-400 mt-1">This is an example page</p>
    </div>
    
    <!-- Team Members Section -->
    <div in:scale={{ duration: 300, delay: 100, start: 0.95 }}>
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-medium text-white">Team Members</h2>
          <button class="text-sm bg-[#444654] hover:bg-[#565869] py-1 px-3 rounded-md text-white transition-colors">
            Invite Member
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {#each members as member}
            <div class="bg-[#2a2b35] p-4 rounded-lg border border-[#444654]/50">
              <div class="flex items-center">
                <img src={member.avatar} alt={member.name} class="w-10 h-10 rounded-full mr-3">
                <div>
                  <p class="text-white font-medium">{member.name}</p>
                  <p class="text-gray-400 text-xs">{member.role}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Current Projects and Activity Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" in:scale={{ duration: 300, delay: 150, start: 0.95 }}>
      <!-- Quick Actions -->
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50">
        <h2 class="text-xl font-medium text-white mb-4">Quick Actions</h2>
        <div class="space-y-3">
          <button class="flex items-center w-full py-2 px-3 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Document
          </button>
          
          <button class="flex items-center w-full py-2 px-3 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Meeting
          </button>
          
          <button class="flex items-center w-full py-2 px-3 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </button>
        </div>
      </div>
      
      <!-- Team Activity -->
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50 lg:col-span-2">
        <h2 class="text-xl font-medium text-white mb-4">Recent Activity</h2>
        <div class="space-y-4">
          {#each activities as activity}
            <div class="bg-[#2a2b35] p-3 rounded-md border border-[#444654]/30">
              <div class="flex items-start">
                <div class="flex-shrink-0 mt-1">
                  {#if activity.type === 'document'}
                    <div class="bg-blue-500/20 p-2 rounded-md text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  {:else if activity.type === 'comment'}
                    <div class="bg-green-500/20 p-2 rounded-md text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  {:else if activity.type === 'code'}
                    <div class="bg-purple-500/20 p-2 rounded-md text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                  {:else}
                    <div class="bg-yellow-500/20 p-2 rounded-md text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  {/if}
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-gray-300">
                    <span class="font-medium text-white">{activity.user}</span> {activity.action}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          {/each}
          
          <a href="/dashboard/activity" class="inline-flex items-center justify-center w-full py-2 px-4 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors mt-2">
            View All Activity
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
    
    <!-- Shared Resources Section -->
    <div class="mt-8" in:scale={{ duration: 300, delay: 200, start: 0.95 }}>
      <div class="bg-[#343541] rounded-lg p-6 shadow-md border border-[#444654]/50">
        <h2 class="text-xl font-medium text-white mb-4">Shared Resources</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-[#444654]/50">
              <tr>
                <th class="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th class="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                <th class="text-left py-3 px-4 text-gray-400 font-medium">Owner</th>
                <th class="text-left py-3 px-4 text-gray-400 font-medium">Modified</th>
                <th class="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#444654]/30">
              <tr>
                <td class="py-3 px-4 text-white">Project Brief</td>
                <td class="py-3 px-4 text-gray-300">Document</td>
                <td class="py-3 px-4 text-gray-300">Alex Morgan</td>
                <td class="py-3 px-4 text-gray-300">1 day ago</td>
                <td class="py-3 px-4">
                  <button class="text-blue-400 hover:text-blue-300">Open</button>
                </td>
              </tr>
              <tr>
                <td class="py-3 px-4 text-white">Design Assets</td>
                <td class="py-3 px-4 text-gray-300">Folder</td>
                <td class="py-3 px-4 text-gray-300">Jamie Lee</td>
                <td class="py-3 px-4 text-gray-300">3 days ago</td>
                <td class="py-3 px-4">
                  <button class="text-blue-400 hover:text-blue-300">Open</button>
                </td>
              </tr>
              <tr>
                <td class="py-3 px-4 text-white">Meeting Notes</td>
                <td class="py-3 px-4 text-gray-300">Document</td>
                <td class="py-3 px-4 text-gray-300">Taylor Kim</td>
                <td class="py-3 px-4 text-gray-300">1 week ago</td>
                <td class="py-3 px-4">
                  <button class="text-blue-400 hover:text-blue-300">Open</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button class="inline-flex items-center py-2 px-4 bg-[#444654] hover:bg-[#565869] rounded-md text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Resource
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex justify-center items-center h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {/if}
</div>
