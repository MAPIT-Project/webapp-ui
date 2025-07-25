<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import Chatbox from "../../components/chatbox.svelte";
	
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from "$lib/clients/clientService";
	import { onMount } from "svelte";
	import { scale, fade } from "svelte/transition";
	import ApiModeToggle from "../../components/api-mode-toggle.svelte";
	import AIProviderSelector from "../../components/ai-provider-selector.svelte";
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';

	
	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);
	
	
	// Create client record if one doesn't exist
	onMount(async () => {
	    if ($user) {
	        try {
	            const client = await ensureClientExists($user.email?.split('@')[0]);
	            if (!client) {
	                console.error("Failed to create or find client record");
	                clientError = "Failed to initialize user data";
	            }
	            // Fetch available AI providers
	            await fetchAvailableProviders();
	        } catch (err) {
	            console.error("Error during client initialization:", err);
	            clientError = "Error setting up user account";
	        } finally {
	            clientLoading = false;
	        }
	    }
	});
</script>

<div class="w-full min-h-screen h-full flex relative bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]">
    <!-- Subtle pattern overlay for texture -->
    <div class="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] pointer-events-none"></div>
    
    <!-- Main content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
        <!-- Header Bar -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                        <Icon name="smart_toy" iconClass="text-white text-sm" />
                    </div>
                    <div>
                        <span class="text-white font-medium">MAPIT AI</span>
                        <span class="text-xs text-white font-bold ml-2 bg-gradient-to-tr from-sky-900 to-sky-700 px-2 py-0.5 rounded-full border border-sky-600/30">BETA</span>
                    </div>
                </div>
            </div>
            
            <!-- API Controls -->
            <div class="flex items-center gap-3">
                <AIProviderSelector />
                <ApiModeToggle />
            </div>
        </div>
    
        <!-- Main Content Area -->
        <div class="flex-1 flex items-center justify-center p-6 relative">
            <!-- Background decoration -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
            </div>
            
            {#if clientLoading}
                <div class="flex flex-col items-center gap-6" in:fade={{ duration: 300 }}>
                    <!-- Enhanced loading animation -->
                    <div class="relative">
                        <div class="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin"></div>
                        <div class="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-r-cyan-500 animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <div class="text-center">
                        <h3 class="text-xl font-semibold text-white mb-2">Setting up your workspace</h3>
                        <p class="text-white/60">Initializing AI services and user data...</p>
                    </div>
                </div>
            {:else if clientError}
                <div class="w-full max-w-md" in:scale={{ duration: 300, start: 0.95 }}>
                    <div class="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div class="flex items-start gap-4">
                            <div class="p-3 bg-red-500/20 rounded-xl">
                                <Icon name="error" iconClass="text-red-400 w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-red-200 mb-2">Something went wrong</h3>
                                <p class="text-red-300 mb-4 text-sm leading-relaxed">{clientError}</p>
                                <button 
                                    class="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-red-500/25"
                                    onclick={() => window.location.reload()}
                                >
                                    <div class="flex items-center justify-center gap-2">
                                        <Icon name="refresh" iconClass="w-4 h-4" />
                                        Try Again
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="w-full max-w-5xl flex flex-col items-center" in:fade={{ duration: 400, delay: 100 }}>
                    <!-- Welcome Section -->
                    <div class="text-center mb-12" in:scale={{ duration: 400, delay: 200, start: 0.95 }}>
                        <div class="inline-flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                                <Icon name="psychology" iconClass="text-white text-xl" />
                            </div>
                            <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                How can I help you today?
                            </h1>
                        </div>
                        <!-- <p class="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Ask me anything about research, analysis, writing, or get assistance with your projects. 
                            I'm here to help you explore ideas and find solutions.
                        </p> -->
                    </div>
                    
                    <!-- Features highlight -->
                    <!-- <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl" in:scale={{ duration: 400, delay: 300, start: 0.95 }}>
                        <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 text-center group hover:scale-105 transition-transform">
                            <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors">
                                <Icon name="search" iconClass="text-blue-400 text-sm" />
                            </div>
                            <h3 class="text-white font-semibold mb-1">Research & Analysis</h3>
                            <p class="text-gray-400 text-sm">Get insights on complex topics and data analysis</p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 text-center group hover:scale-105 transition-transform">
                            <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 transition-colors">
                                <Icon name="edit" iconClass="text-purple-400 text-sm" />
                            </div>
                            <h3 class="text-white font-semibold mb-1">Writing & Editing</h3>
                            <p class="text-gray-400 text-sm">Craft compelling content and improve your writing</p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4 text-center group hover:scale-105 transition-transform">
                            <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/30 transition-colors">
                                <Icon name="lightbulb" iconClass="text-emerald-400 text-sm" />
                            </div>
                            <h3 class="text-white font-semibold mb-1">Creative Solutions</h3>
                            <p class="text-gray-400 text-sm">Brainstorm ideas and solve complex problems</p>
                        </div>
                    </div> -->
                    
                    <!-- Chat interface -->
                    <div in:scale={{ duration: 400, delay: 400, start: 0.95 }}>
                        <Chatbox />
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
