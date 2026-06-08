<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	// State for password visibility toggle
	let showPassword = false;
	let showConfirmPassword = false;

	// Form data
	let email = '';
	let password = '';
	let confirmPassword = '';
	let firstName = '';
	let lastName = '';

	// Form state
	let passwordsMatch = true;
	let isLoading = false;
	let errorMessage = '';

	function validateForm() {
		passwordsMatch = password === confirmPassword;
		return passwordsMatch && firstName.trim() !== '' && lastName.trim() !== '';
	}

	async function handleSubmit() {
		if (!validateForm()) {
			if (!passwordsMatch) {
				errorMessage = 'Passwords do not match';
			} else if (firstName.trim() === '') {
				errorMessage = 'First name is required';
			} else if (lastName.trim() === '') {
				errorMessage = 'Last name is required';
			}
			return;
		}

		if (password.length < 8) {
			errorMessage = 'Password must be at least 8 characters long';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Use our server-side authentication API instead of direct Supabase call
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password,
					firstName,
					lastName
				})
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Registration Error:', result.error);
				errorMessage = result.error || 'Registration failed';
			} else if (result.success) {
				console.log('Registration successful:', result.user);
				console.log('Client record created:', result.client);

				// Navigate to login page
				window.location.href = '/login?registered=true';
			} else {
				errorMessage = 'Registration failed';
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			errorMessage = 'An unexpected error occurred during registration';
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

		<h1 class="mb-8 text-center text-2xl font-semibold text-white tracking-tight">
			Create your MAPIT AI account
		</h1>

		{#if errorMessage}
			<div class="mb-4 rounded-xl border border-[#F44336]/20 bg-[#F44336]/10 p-3">
				<p class="text-sm text-[#F44336]">{errorMessage}</p>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<!-- First Name input -->
			<div class="mb-4">
				<label for="firstName" class="mb-2 block text-sm font-medium text-[#9CA3AF]"
					>First Name</label
				>
				<input
					type="text"
					id="firstName"
					required
					bind:value={firstName}
					class="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F5F5F5] placeholder-[#6B7280] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-colors"
					placeholder="John"
				/>
			</div>

			<!-- Last Name input -->
			<div class="mb-4">
				<label for="lastName" class="mb-2 block text-sm font-medium text-[#9CA3AF]">Last Name</label
				>
				<input
					type="text"
					id="lastName"
					required
					bind:value={lastName}
					class="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F5F5F5] placeholder-[#6B7280] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-colors"
					placeholder="Doe"
				/>
			</div>

			<!-- Email input -->
			<div class="mb-4">
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
			<div class="mb-4">
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
				<p class="mt-1 text-xs text-[#6B7280]">Password must be at least 8 characters long</p>
			</div>

			<!-- Confirm Password input -->
			<div class="mb-6">
				<label for="confirmPassword" class="mb-2 block text-sm font-medium text-[#9CA3AF]"
					>Confirm Password</label
				>
				<div class="relative">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						required
						bind:value={confirmPassword}
						on:input={validateForm}
						class="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F5F5F5] placeholder-[#6B7280] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-colors"
						placeholder="••••••••"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#6B7280] hover:text-[#F5F5F5] transition-colors"
						on:click={() => (showConfirmPassword = !showConfirmPassword)}
					>
						<Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} iconClass="h-5 w-5" />
					</button>
				</div>
				{#if !passwordsMatch && confirmPassword}
					<p class="mt-1 text-xs text-[#F44336]">Passwords do not match</p>
				{/if}
			</div>

			<!-- Register button -->
			<button
				type="submit"
				disabled={isLoading}
				class="mt-4 flex w-full items-center justify-center rounded-xl bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isLoading}
					<span
						class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></span>
					Creating account...
				{:else}
					Create Account
				{/if}
			</button>
		</form>

		<!-- Additional links -->
		<div class="mt-6 text-center">
			<span class="text-sm text-[#9CA3AF]">Already have an account? </span>
			<a href="/login" class="text-sm font-medium text-[#3B82F6] hover:text-[#93C5FD] transition-colors">Sign in</a>
		</div>
	</div>
</main>
