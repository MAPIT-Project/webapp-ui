<script>
	import { page } from '$app/stores';
	import { env } from '$lib/utils/config';

	// Props with defaults
	export let title = 'Mapit AI Expert';
	export let description =
		'Empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology with deep subject expertise.';
	export let keywords = 'AI, domain experts, mapping, data visualization, artificial intelligence';
	export let image = '/images/mapit_logo_no_bg.png';
	export let canonical = undefined;

	// Compute the canonical URL
	$: canonicalUrl = canonical || `${env.PUBLIC_APP_URL}${$page.url.pathname}`;

	// Construct title with site name
	$: fullTitle = title === env.PUBLIC_APP_NAME ? title : `${title} | ${env.PUBLIC_APP_NAME}`;
</script>

<svelte:head>
	<!-- Basic meta tags -->
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />

	<!-- Canonical URL -->
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={`${env.PUBLIC_APP_URL}${image}`} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta property="twitter:title" content={fullTitle} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={`${env.PUBLIC_APP_URL}${image}`} />
</svelte:head>
