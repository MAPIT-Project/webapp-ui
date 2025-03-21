<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import { supabase } from "$lib/clients/supabaseClient"; 
	import { goto } from "$app/navigation";
	
	// State for password visibility toggle
	let showPassword = false;
	let showConfirmPassword = false;
	
	// Form data
	let email = '';
	let password = '';
	let confirmPassword = '';
	
	// Form state
	let passwordsMatch = true;
	let isLoading = false;
	let errorMessage = '';
	
	function validateForm() {
		passwordsMatch = password === confirmPassword;
		return passwordsMatch;
	}
	
	async function handleSubmit() {
		if (!validateForm()) {
			errorMessage = 'Passwords do not match';
			return;
		}
		
		if (password.length < 8) {
			errorMessage = 'Password must be at least 8 characters long';
			return;
		}
		
		isLoading = true;
		errorMessage = '';
		
		try {
			// Use supabase directly instead of the signUp function
			const { data, error } = await supabase.auth.signUp({
				email,
				password
			});
			
			if (error) {
				console.error("Registration Error:", error.message);
				errorMessage = error.message;
			} else {
				// Registration successful
				console.log('Registration successful:', data?.user);
				// Navigate to login page
				window.location.href = '/login?registered=true';
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			errorMessage = 'An unexpected error occurred during registration';
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
        
        <h1 class="text-2xl font-semibold text-[#CACACA] text-center mb-8">Create your MAPIT AI account</h1>
        
        {#if errorMessage}
            <div class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <p class="text-sm text-red-300">{errorMessage}</p>
            </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit}>
            <!-- Email input -->
            <div class="pt-4">
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
                <p class="text-xs text-gray-400 mt-1">Password must be at least 8 characters long</p>
            </div>
            
            <!-- Confirm Password input -->
            <div class="pt-4">
                <label for="confirmPassword" class="block text-sm font-medium text-[#CACACA] mb-2">Confirm Password</label>
                <div class="relative">
                    <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        id="confirmPassword" 
                        required
                        bind:value={confirmPassword}
                        on:input={validateForm}
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-[#CACACA] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CACACA] hover:text-white"
                        on:click={() => showConfirmPassword = !showConfirmPassword}
                    >
                        <Icon name={showConfirmPassword ? "eye-off" : "eye"} class="h-5 w-5" />
                    </button>
                </div>
                {#if !passwordsMatch && confirmPassword}
                    <p class="text-xs text-red-400 mt-1">Passwords do not match</p>
                {/if}
            </div>
            
            <!-- Register button -->
            <button 
                type="submit" 
                disabled={isLoading}
                class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center"
            >
                {#if isLoading}
                    <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating account...
                {:else}
                    Create Account
                {/if}
            </button>
        </form>
        
        <!-- Additional links -->
        <div class="mt-6 text-center">
            <span class="text-sm text-[#CACACA]">Already have an account? </span>
            <a href="/login" class="text-sm text-blue-400 hover:text-blue-300">Sign in</a>
        </div>
    </div>
</main>
