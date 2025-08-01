<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import { goto } from '$app/navigation';

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

<main class="relative flex h-full min-h-screen w-full items-center justify-center bg-gray-900">
	<span class="absolute left-4 top-4 text-xs text-[#CACACA]"
		>AI Domain Expert Tool <span class="ml-1 text-[0.5rem] font-bold">BETA</span></span
	>

	<div class="mx-4 w-full rounded-2xl bg-gray-800 p-8 shadow-xl" style="max-width: 24rem;">
		<!-- Logo placeholder - replace with actual logo -->
		<div class="mb-6 flex justify-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
				<Icon name="psychology" class="h-8 w-8 text-[#CACACA]" />
			</div>
		</div>

		<h1 class="mb-8 text-center text-2xl font-semibold text-[#CACACA]">
			Create your MAPIT AI account
		</h1>

		{#if errorMessage}
			<div class="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3">
				<p class="text-sm text-red-300">{errorMessage}</p>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<!-- First Name input -->
			<div class="mb-4">
				<label for="firstName" class="mb-2 block text-sm font-medium text-[#CACACA]"
					>First Name</label
				>
				<input
					type="text"
					id="firstName"
					required
					bind:value={firstName}
					class="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-[#CACACA] focus:border-transparent focus:ring-2 focus:ring-blue-500"
					placeholder="John"
				/>
			</div>

			<!-- Last Name input -->
			<div class="mb-4">
				<label for="lastName" class="mb-2 block text-sm font-medium text-[#CACACA]">Last Name</label
				>
				<input
					type="text"
					id="lastName"
					required
					bind:value={lastName}
					class="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-[#CACACA] focus:border-transparent focus:ring-2 focus:ring-blue-500"
					placeholder="Doe"
				/>
			</div>

			<!-- Email input -->
			<div class="mb-4">
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
			<div class="mb-4">
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
						<Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} class="h-5 w-5" />
					</button>
				</div>
				<p class="mt-1 text-xs text-gray-400">Password must be at least 8 characters long</p>
			</div>

			<!-- Confirm Password input -->
			<div class="mb-6">
				<label for="confirmPassword" class="mb-2 block text-sm font-medium text-[#CACACA]"
					>Confirm Password</label
				>
				<div class="relative">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						required
						bind:value={confirmPassword}
						on:input={validateForm}
						class="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-[#CACACA] focus:border-transparent focus:ring-2 focus:ring-blue-500"
						placeholder="••••••••"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#CACACA] hover:text-white"
						on:click={() => (showConfirmPassword = !showConfirmPassword)}
					>
						<Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} class="h-5 w-5" />
					</button>
				</div>
				{#if !passwordsMatch && confirmPassword}
					<p class="mt-1 text-xs text-red-400">Passwords do not match</p>
				{/if}
			</div>

			<!-- Register button -->
			<button
				type="submit"
				disabled={isLoading}
				class="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
			<span class="text-sm text-[#CACACA]">Already have an account? </span>
			<a href="/login" class="text-sm text-blue-400 hover:text-blue-300">Sign in</a>
		</div>
	</div>
</main>
