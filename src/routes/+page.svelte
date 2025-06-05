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
    <header class="bg-[#2B2A2C] shadow w-full border-b border-[#4A4A57]">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" class="text-xl font-bold text-[#F9F9FA] flex items-center">
            <img src="/images/mapit_logo_no_bg.png" alt="Mapit AI Logo" class="h-8 mr-2">
            Mapit AI Expert
        </a>
        
        <!-- Mobile menu button -->
        <button 
            class="md:hidden p-2 rounded-md text-[#A0A0A8] hover:text-[#F9F9FA] hover:bg-[#383842]"
            on:click={toggleMobileMenu}
            aria-label="Toggle mobile menu"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {#if mobileMenuOpen}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                {:else}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                {/if}
            </svg>
        </button>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:block">
            <ul class="flex space-x-6">
            <li><a href="/" class="text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Home</a></li>
            <li><a href="/about" class="text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">About</a></li>
            <li><a href="/features" class="text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Features</a></li>
            <li><a href="/contact" class="text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Contact</a></li>
            </ul>
        </nav>
        </div>
        
        <!-- Mobile Navigation -->
        {#if mobileMenuOpen}
        <div class="md:hidden bg-[#2B2A2C] border-t border-[#4A4A57]">
            <ul class="px-4 py-3 space-y-3">
            <li><a href="/" class="block text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Home</a></li>
            <li><a href="/about" class="block text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">About</a></li>
            <li><a href="/features" class="block text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Features</a></li>
            <li><a href="/contact" class="block text-[#A0A0A8] hover:text-[#F9F9FA] transition-colors">Contact</a></li>
            </ul>
        </div>
        {/if}
    </header>

    <!-- Hero Section -->
    <section class="bg-[#2F2F33] text-[#F9F9FA] w-full">
        <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-4xl md:text-5xl font-extrabold mb-4 break-words">
            Mapit AI Domain Expert Tool
        </h1>
        <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-[#A0A0A8]">
            Empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology with deep subject expertise.
        </p>
        <a href="/dashboard" class="inline-block bg-[#525252] text-[#F9F9FA] font-semibold px-8 py-3 rounded-full shadow hover:bg-[#606060] transition-colors">
            Get Started
        </a>
        </div>
    </section>

    <!-- About/Features Section -->
    <section class="container mx-auto px-4 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
            <h2 class="text-2xl font-bold text-[#F9F9FA] mb-4">About Mapit AI</h2>
            <p class="text-[#A0A0A8] leading-relaxed mb-4">
            The Mapit AI Expert tool is a core part of the MAPIT project, designed to integrate domain-specific knowledge with state-of-the-art AI. By leveraging a unique blend of technical expertise and advanced algorithms, we empower experts in various domains to extract, analyze, and apply insights with greater efficiency.
            </p>
            <p class="text-[#A0A0A8] leading-relaxed">
            Whether you are a researcher, a professional, or simply curious about the intersection of AI and domain expertise, our platform provides a comprehensive suite of tools to support your journey.
            </p>
        </div>
        <div class="flex items-center justify-center">
            <!-- Placeholder image – replace with a relevant graphic or screenshot -->
            <img src="/images/mapit_logo_no_bg.png" alt="Mapit AI Illustration" class="max-w-full h-auto rounded shadow-lg">
        </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="bg-[#343541] py-16 w-full">
        <div class="container mx-auto px-4 text-center">
        <h3 class="text-3xl font-bold text-[#F9F9FA] mb-4">Ready to Experience the Future?</h3>
        <p class="text-[#A0A0A8] mb-8 max-w-xl mx-auto">
            Discover how Mapit AI Expert can transform the way you work with domain-specific data and insights.
        </p>
        <a href="/demo" class="inline-block bg-[#525252] text-[#F9F9FA] font-semibold px-8 py-3 rounded-full shadow hover:bg-[#606060] transition-colors">
            View Demo
        </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#2B2A2C] text-[#A0A0A8] py-6 w-full border-t border-[#4A4A57]">
        <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p class="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Mapit AI Expert. All rights reserved.</p>
        <nav>
            <ul class="flex space-x-4">
            <li><a href="/privacy" class="hover:text-[#F9F9FA] transition-colors">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:text-[#F9F9FA] transition-colors">Terms of Use</a></li>
            </ul>
        </nav>
        </div>
    </footer>
</div>