<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
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
			// Use our server-side authentication API instead of direct Supabase call
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password
				})
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Login Error:', result.error);
				errorMessage = result.error || 'Login failed';
			} else if (result.success) {
				console.log('Login successful:', result.user);
				// Update user store
				user.set(result.user);

				// Add a small delay to ensure cookies are processed
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Navigate to dashboard with proper invalidation
				await goto('/dashboard', {
					invalidateAll: true,
					replaceState: true
				});
			} else {
				errorMessage = 'Login failed';
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			errorMessage = 'An unexpected error occurred during login';
		} finally {
			isLoading = false;
		}
	}
</script>

<main class="relative flex h-full min-h-screen w-full items-center justify-center bg-gray-900">
	<span class="absolute left-4 top-4 text-xs text-[#CACACA]"
		>AI Domain Expert Tool <span class="ml-1 text-[0.5rem] font-bold">BETA</span></span
	>

	<div class="mx-4 w-full rounded-2xl bg-gray-800 p-8 shadow-xl" style="max-width: 24rem;">
		<!-- Logo placeholder - replace with actual logo -->
		<div class="mb-6 flex justify-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
				<Icon name="psychology" iconClass="text-[#CACACA] h-8 w-8" />
			</div>
		</div>

		<h1 class="mb-8 text-center text-2xl font-semibold text-[#CACACA]">Sign in to MAPIT AI</h1>

		{#if justRegistered}
			<div class="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3">
				<p class="text-sm text-green-300">Account created successfully!</p>
			</div>
		{/if}

		{#if errorMessage}
			<div class="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3">
				<p class="text-sm text-red-300">{errorMessage}</p>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<!-- Email input -->
			<div class="">
				<label for="email" class="mb-2 block text-sm font-medium text-[#CACACA]">Email</label>
				<input
					type="email"
					id="email"
					required
					bind:value={email}
					class="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-[#CACACA] focus:border-transparent focus:ring-2 focus:ring-blue-500"
					placeholder="your@email.com"
				/>
			</div>

			<!-- Password input -->
			<div class="pt-2">
				<label for="password" class="mb-2 block text-sm font-medium text-[#CACACA]">Password</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						required
						bind:value={password}
						class="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-[#CACACA] focus:border-transparent focus:ring-2 focus:ring-blue-500"
						placeholder="••••••••"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#CACACA] hover:text-white"
						on:click={() => (showPassword = !showPassword)}
					>
						<Icon name={showPassword ? 'visibility_off' : 'visibility'} iconClass="h-5 w-5" />
					</button>
				</div>
			</div>

			<!-- Login button -->
			<button
				type="submit"
				disabled={isLoading}
				class="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isLoading}
					<span
						class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></span>
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
