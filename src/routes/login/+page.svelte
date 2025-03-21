<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import { supabase } from "$lib/clients/supabaseClient";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { user } from '$lib/stores/sessionStore';
	
	// State for password visibility toggle
	let showPassword = false;
	
	// Form data
	let email = '';
	let password = '';
	
	// Form state
	let isLoading = false;
	let errorMessage = '';
	
	// Check if redirected from registration
	$: justRegistered = $page?.url.searchParams.has('registered');
	
	async function handleSubmit() {
		isLoading = true;
		errorMessage = '';
		
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			
			if (error) {
				console.error("Login Error:", error.message);
				errorMessage = error.message;
			} else {
				 // Update user store
				user.set(data.user);
				// Navigate to dashboard
				window.location.href = '/dashboard';
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			errorMessage = 'An unexpected error occurred during login';
		} finally {
			isLoading = false;
		}
	}
</script>

<main class="w-full min-h-screen h-full flex items-center justify-center relative bg-gray-900">
    <span class="text-[#CACACA] text-xs absolute left-4 top-4">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1">BETA</span></span>
    
    <div class="w-full p-8 mx-4 bg-gray-800 rounded-2xl shadow-xl" style="max-width: 24rem;">
        <!-- Logo placeholder - replace with actual logo -->
        <div class="flex justify-center mb-6">
            <div class="h-12 w-12 bg-gray-700 rounded-full flex items-center justify-center">
                <Icon name="brain" class="text-[#CACACA] h-8 w-8" />
            </div>
        </div>
        
        <h1 class="text-2xl font-semibold text-[#CACACA] text-center mb-8">Sign in to MAPIT AI</h1>
        
        {#if justRegistered}
            <div class="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                <p class="text-sm text-green-300">
                    Account created successfully!
                </p>
            </div>
        {/if}
        
        {#if errorMessage}
            <div class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <p class="text-sm text-red-300">{errorMessage}</p>
            </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit}>
            <!-- Email input -->
            <div class="">
                <label for="email" class="block text-sm font-medium text-[#CACACA] mb-2">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    required
                    bind:value={email}
                    class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-[#CACACA] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                />
            </div>
            
            <!-- Password input -->
            <div class="pt-2">
                <label for="password" class="block text-sm font-medium text-[#CACACA] mb-2">Password</label>
                <div class="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        id="password" 
                        required
                        bind:value={password}
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-[#CACACA] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CACACA] hover:text-white"
                        on:click={() => showPassword = !showPassword}
                    >
                        <Icon name={showPassword ? "eye-off" : "eye"} class="h-5 w-5" />
                    </button>
                </div>
            </div>
            
            <!-- Login button -->
            <button 
                type="submit" 
                disabled={isLoading}
                class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center"
            >
                {#if isLoading}
                    <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Signing in...
                {:else}
                    Sign in
                {/if}
            </button>
        </form>
        
        <!-- Additional links -->
        <div class="mt-6 text-center">
            <span class="text-sm text-[#CACACA]">Don't have an account? </span>
            <a href="/register" class="text-sm text-blue-400 hover:text-blue-300">Sign up</a>
        </div>
    </div>
</main>