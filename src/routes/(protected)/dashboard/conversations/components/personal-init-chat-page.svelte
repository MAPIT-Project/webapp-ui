<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Chatbox from '../../components/chatbox.svelte';

	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from '$lib/clients/clientService';
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import ApiModeToggle from '../../components/api-mode-toggle.svelte';
	import AIProviderSelector from '../../components/ai-provider-selector.svelte';
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';

	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);

	// Create client record if one doesn't exist
	onMount(async () => {
		if ($user) {
			try {
				const client = await ensureClientExists($user.email?.split('@')[0]);
				if (!client) {
					console.error('Failed to create or find client record');
					clientError = 'Failed to initialize user data';
				}
				// Fetch available AI providers
				await fetchAvailableProviders();
			} catch (err) {
				console.error('Error during client initialization:', err);
				clientError = 'Error setting up user account';
			} finally {
				clientLoading = false;
			}
		}
	});
</script>

<div
	class="relative flex h-full min-h-screen w-full bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
>
	<!-- Subtle pattern overlay for texture -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
	></div>

	<!-- Main content -->
	<div class="relative flex flex-1 flex-col overflow-hidden">
		<!-- Header Bar -->
		<div class="flex items-center justify-between border-b border-[#2C2C2C] bg-[#1E1E1E] p-4">
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10"
					>
						<Icon name="smart_toy" iconClass="text-white text-sm" />
					</div>
					<div>
						<span class="font-medium text-[#E0E0E0]">MAPIT AI</span>
						<span
							class="ml-2 rounded-full border border-[#4F4F4F] bg-[#3A3A3A] px-2 py-0.5 text-xs font-bold text-[#FFFFFF]"
							>BETA</span
						>
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
		<div class="relative flex flex-1 items-center justify-center p-6">
			<!-- Background decoration -->
			<div class="pointer-events-none absolute inset-0 overflow-hidden">
				<div class="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl"></div>
				<div
					class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl"
				></div>
			</div>

			{#if clientLoading}
				<div class="flex flex-col items-center gap-6" in:fade={{ duration: 300 }}>
					<!-- Enhanced loading animation -->
					<div class="relative">
						<div
							class="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"
						></div>
						<div
							class="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-r-cyan-500"
							style="animation-direction: reverse; animation-duration: 1.5s;"
						></div>
					</div>
					<div class="text-center">
						<h3 class="mb-2 text-xl font-semibold text-[#E0E0E0]">Setting up your workspace</h3>
						<p class="text-[#B0B0B0]">Initializing AI services and user data...</p>
					</div>
				</div>
			{:else if clientError}
				<div class="w-full max-w-md" in:scale={{ duration: 300, start: 0.95 }}>
					<div
						class="rounded-2xl border border-[#F44336]/50 bg-[#1E1E1E] p-6 shadow-xl backdrop-blur-sm"
					>
						<div class="flex items-start gap-4">
							<div class="rounded-xl bg-red-500/20 p-3">
								<Icon name="error" iconClass="text-red-400 w-6 h-6" />
							</div>
							<div class="flex-1">
								<h3 class="mb-2 text-lg font-semibold text-[#F44336]">Something went wrong</h3>
								<p class="mb-4 text-sm leading-relaxed text-[#F44336]">{clientError}</p>
								<button
									class="w-full rounded-xl bg-[#8A2BE2] px-4 py-3 font-medium text-[#FFFFFF] transition-all hover:bg-[#A052E8]"
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
				<div
					class="flex w-full max-w-5xl flex-col items-center"
					in:fade={{ duration: 400, delay: 100 }}
				>
					<!-- Welcome Section -->
					<div class="mb-12 text-center" in:scale={{ duration: 400, delay: 200, start: 0.95 }}>
						<div class="mb-4 inline-flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg"
							>
								<Icon name="psychology" iconClass="text-white text-xl" />
							</div>
							<h1 class="text-4xl font-bold text-[#E0E0E0]">How can I help you today?</h1>
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
