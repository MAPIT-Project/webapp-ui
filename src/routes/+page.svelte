<script>
    // Add any Svelte-specific interactivity here if needed.
</script>
  
<!-- Main Container -->
<div class="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">

    <!-- Navigation -->
    <header class="bg-white shadow w-full">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" class="text-xl font-bold text-gray-800">
            Mapit AI Expert
        </a>
        <nav>
            <ul class="flex space-x-6">
            <li><a href="/" class="text-gray-600 hover:text-gray-900">Home</a></li>
            <li><a href="/about" class="text-gray-600 hover:text-gray-900">About</a></li>
            <li><a href="/features" class="text-gray-600 hover:text-gray-900">Features</a></li>
            <li><a href="/contact" class="text-gray-600 hover:text-gray-900">Contact</a></li>
            </ul>
        </nav>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white w-full">
        <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-4xl md:text-5xl font-extrabold mb-4 break-words">
            Mapit AI Domain Expert Tool
        </h1>
        <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology with deep subject expertise.
        </p>
        <a href="/dashboard" class="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-full shadow hover:bg-gray-100 transition">
            Get Started
        </a>
        </div>
    </section>

    <!-- About/Features Section -->
    <section class="container mx-auto px-4 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">About Mapit AI</h2>
            <p class="text-gray-600 leading-relaxed mb-4">
            The Mapit AI Expert tool is a core part of the MAPIT project, designed to integrate domain-specific knowledge with state-of-the-art AI. By leveraging a unique blend of technical expertise and advanced algorithms, we empower experts in various domains to extract, analyze, and apply insights with greater efficiency.
            </p>
            <p class="text-gray-600 leading-relaxed">
            Whether you are a researcher, a professional, or simply curious about the intersection of AI and domain expertise, our platform provides a comprehensive suite of tools to support your journey.
            </p>
        </div>
        <div class="flex items-center justify-center">
            <!-- Placeholder image – replace with a relevant graphic or screenshot -->
            <img src="/path/to/mapit-ai-illustration.svg" alt="Mapit AI Illustration" class="max-w-full h-auto rounded shadow">
        </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="bg-white py-16 w-full">
        <div class="container mx-auto px-4 text-center">
        <h3 class="text-3xl font-bold text-gray-800 mb-4">Ready to Experience the Future?</h3>
        <p class="text-gray-600 mb-8 max-w-xl mx-auto">
            Discover how Mapit AI Expert can transform the way you work with domain-specific data and insights.
        </p>
        <a href="/demo" class="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-full shadow hover:bg-blue-700 transition">
            View Demo
        </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-gray-200 py-6 w-full">
        <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <p class="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Mapit AI Expert. All rights reserved.</p>
        <nav>
            <ul class="flex space-x-4">
            <li><a href="/privacy" class="hover:underline">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:underline">Terms of Use</a></li>
            </ul>
        </nav>
        </div>
    </footer>
</div>