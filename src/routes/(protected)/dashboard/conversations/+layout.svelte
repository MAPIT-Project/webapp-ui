<script lang="ts">
import ChatSidebar from "../components/chat-sidebar.svelte";

let { children } = $props();
</script>

<div class="flex h-screen bg-[#2B2A2C]">
    <!-- Chat Sidebar - fixed width, persists across conversation navigation -->
    <div class="flex-shrink-0">
        <ChatSidebar />
    </div>
    
    <!-- Main content area - takes remaining space -->
    <div class="flex-1 overflow-hidden">
        {@render children()}
    </div>
</div> 