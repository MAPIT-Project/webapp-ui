<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/sessionStore';
	import { fade, fly } from 'svelte/transition';

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

<main class="relative flex h-full min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#141414] text-[#F5F5F5]">
	<span class="absolute left-4 top-4 text-xs text-[#6B7280]" in:fade={{ duration: 300, delay: 200 }}
		>AI Domain Expert Tool <span class="ml-1 text-[0.5rem] font-bold">BETA</span></span
	>

	<div class="mx-4 w-full rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] p-8 shadow-xl" style="max-width: 24rem;" in:fly={{ y: 20, duration: 400 }}>
		<div class="mb-6 flex justify-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A2A2A] text-[#6B7280]">
				<Icon name="psychology" iconSize="2xl" />
			</div>
		</div>

		<h1 class="mb-8 text-center text-2xl font-semibold text-white tracking-tight">Sign in to MAPIT AI</h1>

		{#if justRegistered}
			<div class="mb-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-3">
				<p class="text-sm text-[#10B981]">Account created successfully!</p>
			</div>
		{/if}

		{#if errorMessage}
			<div class="mb-4 rounded-xl border border-[#F44336]/20 bg-[#F44336]/10 p-3">
				<p class="text-sm text-[#F44336]">{errorMessage}</p>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<!-- Email input -->
			<div class="">
				<label for="email" class="mb-2 block text-sm font-medium text-[#9CA3AF]">Email</label>
				<input
					type="email"
					id="email"
					required
					bind:value={email}
					class="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F5F5F5] placeholder-[#6B7280] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-colors"
					placeholder="your@email.com"
				/>
			</div>

			<!-- Password input -->
			<div class="pt-4">
				<label for="password" class="mb-2 block text-sm font-medium text-[#9CA3AF]">Password</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						required
						bind:value={password}
						class="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F5F5F5] placeholder-[#6B7280] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-colors"
						placeholder="••••••••"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#6B7280] hover:text-[#F5F5F5] transition-colors"
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
				class="mt-6 flex w-full items-center justify-center rounded-xl bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
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
			<span class="text-sm text-[#9CA3AF]">Don't have an account? </span>
			<a href="/register" class="text-sm font-medium text-[#3B82F6] hover:text-[#93C5FD] transition-colors">Sign up</a>
		</div>
	</div>
</main>
