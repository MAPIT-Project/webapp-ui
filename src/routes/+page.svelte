<script>
	import SEO from '$lib/components/generic/seo.svelte';

	// Add Svelte interactivity for mobile menu
	let mobileMenuOpen = false;

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<SEO
	title="Home"
	description="Mapit AI Expert - Empowering domain experts with advanced AI-driven insights and interactive mapping visualization."
	keywords="AI, domain experts, mapping, data visualization, artificial intelligence, Mapit AI"
/>

<!-- Main Container -->
<div class="bg-[#1E1E20]">
	<!-- Navigation -->
	<header class="w-full border-b border-[#4A4A57] shadow">
		<div class="container mx-auto flex items-center justify-between px-4 py-4">
			<a href="/" class="flex items-center text-xl font-bold text-[#F9F9FA]">
				<img src="/images/mapit_logo_no_bg.png" alt="Mapit AI Logo" class="mr-2 h-8" />
				Mapit AI Expert
			</a>

			<!-- Mobile menu button -->
			<button
				class="rounded-md p-2 text-[#A0A0A8] hover:bg-[#383842] hover:text-[#F9F9FA] md:hidden"
				on:click={toggleMobileMenu}
				aria-label="Toggle mobile menu"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					{#if mobileMenuOpen}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					{:else}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					{/if}
				</svg>
			</button>

			<!-- Desktop Navigation -->
			<nav class="hidden md:block">
				<ul class="flex space-x-6">
					<li>
						<a href="/" class="text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]">Home</a>
					</li>
					<li>
						<a href="/about" class="text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]">About</a>
					</li>
					<li>
						<a href="/features" class="text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]"
							>Features</a
						>
					</li>
					<li>
						<a href="/contact" class="text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]"
							>Contact</a
						>
					</li>
				</ul>
			</nav>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="border-t border-[#4A4A57] md:hidden">
				<ul class="space-y-3 px-4 py-3">
					<li>
						<a href="/" class="block text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]">Home</a>
					</li>
					<li>
						<a href="/about" class="block text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]"
							>About</a
						>
					</li>
					<li>
						<a href="/features" class="block text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]"
							>Features</a
						>
					</li>
					<li>
						<a href="/contact" class="block text-[#A0A0A8] transition-colors hover:text-[#F9F9FA]"
							>Contact</a
						>
					</li>
				</ul>
			</div>
		{/if}
	</header>

	<!-- Hero Section -->
	<section class="w-full bg-[#2F2F33] text-[#F9F9FA]">
		<div class="container mx-auto px-4 py-20 text-center">
			<h1 class="mb-4 break-words text-4xl font-extrabold md:text-5xl">
				Mapit AI Domain Expert Tool
			</h1>
			<p class="mx-auto mb-8 max-w-2xl text-lg text-[#A0A0A8] md:text-xl">
				Empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology
				with deep subject expertise.
			</p>
			<a
				href="/dashboard"
				class="inline-block rounded-full bg-[#525252] px-8 py-3 font-semibold text-[#F9F9FA] shadow transition-colors hover:bg-[#606060]"
			>
				Get Started
			</a>
		</div>
	</section>

	<!-- About/Features Section -->
	<section class="container mx-auto px-4 py-16">
		<div class="grid grid-cols-1 gap-12 md:grid-cols-2">
			<div>
				<h2 class="mb-4 text-2xl font-bold text-[#F9F9FA]">About Mapit AI</h2>
				<p class="mb-4 leading-relaxed text-[#A0A0A8]">
					The Mapit AI Expert tool is a core part of the MAPIT project, designed to integrate
					domain-specific knowledge with state-of-the-art AI. By leveraging a unique blend of
					technical expertise and advanced algorithms, we empower experts in various domains to
					extract, analyze, and apply insights with greater efficiency.
				</p>
				<p class="leading-relaxed text-[#A0A0A8]">
					Whether you are a researcher, a professional, or simply curious about the intersection of
					AI and domain expertise, our platform provides a comprehensive suite of tools to support
					your journey.
				</p>
			</div>
			<div class="flex items-center justify-center">
				<!-- Placeholder image – replace with a relevant graphic or screenshot -->
				<img
					src="/images/mapit_logo_no_bg.png"
					alt="Mapit AI Illustration"
					class="h-auto max-w-full rounded shadow-lg"
				/>
			</div>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="w-full bg-[#343541] py-16">
		<div class="container mx-auto px-4 text-center">
			<h3 class="mb-4 text-3xl font-bold text-[#F9F9FA]">Ready to Experience the Future?</h3>
			<p class="mx-auto mb-8 max-w-xl text-[#A0A0A8]">
				Discover how Mapit AI Expert can transform the way you work with domain-specific data and
				insights.
			</p>
			<a
				href="/demo"
				class="inline-block rounded-full bg-[#525252] px-8 py-3 font-semibold text-[#F9F9FA] shadow transition-colors hover:bg-[#606060]"
			>
				View Demo
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="w-full border-t border-[#4A4A57] py-6 text-[#A0A0A8]">
		<div class="container mx-auto flex flex-col items-center justify-between px-4 md:flex-row">
			<p class="mb-4 md:mb-0">
				&copy; {new Date().getFullYear()} Mapit AI Expert. All rights reserved.
			</p>
			<nav>
				<ul class="flex space-x-4">
					<li>
						<a href="/privacy" class="transition-colors hover:text-[#F9F9FA]">Privacy Policy</a>
					</li>
					<li><a href="/terms" class="transition-colors hover:text-[#F9F9FA]">Terms of Use</a></li>
				</ul>
			</nav>
		</div>
	</footer>
</div>
