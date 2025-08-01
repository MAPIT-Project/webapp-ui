<script lang="ts">
	import { onMount, mount } from 'svelte';
	import OrgPopup from './components/OrgPopup.svelte';
	import { searchStore } from '$lib/stores/searchStore';
	import MapSearch from '$components/MapSearch.svelte';

	const apiKey = 'AIzaSyDh3AuMgN7JAR5vLJHpyZRmvHlVfCzZ7_Y';

	const MIN_ZOOM_FOR_MARKERS = 12; // Minimum zoom level to show markers
	const SPIDER_LAYOUT_ZOOM = 12; // Zoom level to switch to spider layout

	let map: google.maps.Map;
	let heatmap: google.maps.visualization.HeatmapLayer;
	let markers: google.maps.Marker[] = [];
	let infoWindows: google.maps.InfoWindow[] = [];
	let currentZoom = 4;
	let isLoading = false;
	let loadingIndicator: HTMLDivElement;

	// Group organizations by location
	let locationClusters: Record<string, any[]> = {};

	// Throttle function to prevent too many API calls
	function throttle(fn: Function, delay: number) {
		let lastCall = 0;
		return function (...args: any[]) {
			const now = new Date().getTime();
			if (now - lastCall < delay) {
				return;
			}
			lastCall = now;
			return fn(...args);
		};
	}

	// Format numbers with proper grouping
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-EU', {
			maximumFractionDigits: 0
		}).format(num);
	}

	// Clear existing markers and info windows
	function clearMarkers() {
		markers.forEach((marker) => marker.setMap(null));
		infoWindows.forEach((window) => window.close());
		markers = [];
		infoWindows = [];
		locationClusters = {};
	}

	// Load data based on current viewport bounds and zoom level
	async function loadViewportData() {
		if (isLoading || !map) return;

		const bounds = map.getBounds();
		if (!bounds) return;

		const zoom = map.getZoom();
		currentZoom = zoom;

		isLoading = true;
		if (loadingIndicator) loadingIndicator.style.display = 'block';

		try {
			const ne = bounds.getNorthEast();
			const sw = bounds.getSouthWest();

			// Check if we have an active search
			const currentSearch = searchQuery.trim();

			// Build URL with viewport bounds
			let url = `/api/heatmap?north=${ne.lat()}&south=${sw.lat()}&east=${ne.lng()}&west=${sw.lng()}&zoom=${zoom}`;

			// Append search parameters if we have an active search
			if (currentSearch) {
				url += `&search=${encodeURIComponent(currentSearch)}`;
			}

			const response = await fetch(url).then((res) => res.json());

			// Handle the new API response structure
			const data = response.results || [];
			const totalCount = response.totalCount || 0;

			// Clear existing markers
			clearMarkers();

			// For low zoom levels, get more comprehensive data for heatmap
			if (zoom < 6) {
				// Fetch heatmap-optimized data (more points)
				const heatmapUrl = `${url}&heatmapOnly=true`;
				const heatmapResponse = await fetch(heatmapUrl).then((res) => res.json());
				const heatmapData = heatmapResponse.results || [];

				// Update heatmap with more comprehensive data
				updateHeatmap(heatmapData);
			} else {
				// At higher zoom levels, we can use the same data for both
				updateHeatmap(data);
			}

			// Only add markers if we're zoomed in enough
			if (zoom >= MIN_ZOOM_FOR_MARKERS) {
				addOrganizationMarkers(data);
			}

			// Update search results if we have an active search
			if (currentSearch) {
				const matchResults = data.filter((org: any) => org.isSearchMatch);
				searchStore.update((state) => ({
					...state,
					results: matchResults,
					totalCount: totalCount
				}));
			}
		} catch (error) {
			console.error('Error loading viewport data:', error);
		} finally {
			isLoading = false;
			if (loadingIndicator) loadingIndicator.style.display = 'none';
		}
	}

	// Update heatmap with new data
	function updateHeatmap(data: any[]) {
		if (!heatmap) {
			// Create initial heatmap
			const heatmapPoints = data.map((entry) => ({
				location: new google.maps.LatLng(entry.location.lat, entry.location.lng),
				weight: entry.weight
			}));

			heatmap = new google.maps.visualization.HeatmapLayer({
				data: heatmapPoints,
				radius: 30,
				dissipating: true,
				opacity: 1.0,
				gradient: [
					'rgba(0, 0, 255, 0)',
					'rgba(0, 0, 255, 1)',
					'rgba(0, 255, 255, 1)',
					'rgba(0, 255, 0, 1)',
					'rgba(255, 255, 0, 1)',
					'rgba(255, 0, 0, 1)'
				]
			});

			heatmap.setMap(map);
		} else {
			// Update existing heatmap data
			const heatmapData = data.map((entry) => ({
				location: new google.maps.LatLng(entry.location.lat, entry.location.lng),
				weight: entry.weight
			}));

			heatmap.setData(heatmapData);
		}
	}

	let searchQuery = '';
	let searchResults: any[] = [];
	let isSearching = false;

	// Set up subscription to the search store
	const unsubscribe = searchStore.subscribe((state) => {
		searchQuery = state.query;
		searchResults = state.results;
		isSearching = state.isSearching;
	});

	// Perform search functionality - exposed for the MapSearch component
	async function performSearch() {
		if (loadingIndicator) loadingIndicator.style.display = 'block';

		try {
			const bounds = map.getBounds();
			if (!bounds) return;

			const ne = bounds.getNorthEast();
			const sw = bounds.getSouthWest();
			const zoom = map.getZoom();

			// Standard request for markers (limited to 1000 points)
			const url = `/api/heatmap?north=${ne.lat()}&south=${sw.lat()}&east=${ne.lng()}&west=${sw.lng()}&zoom=${zoom}&search=${encodeURIComponent(searchQuery.trim())}`;
			const response = await fetch(url).then((res) => res.json());

			// Handle the new API response structure
			const data = response.results || [];
			const totalCount = response.totalCount || 0;

			// Always fetch ALL matching organizations for the heatmap when searching
			if (totalCount > data.length) {
				// Request ALL data points for accurate heatmap visualization
				const heatmapUrl = `${url}&heatmapOnly=true`;
				const heatmapResponse = await fetch(heatmapUrl).then((res) => res.json());
				const heatmapData = heatmapResponse.results || [];

				// Update heatmap with the complete dataset
				updateHeatmap(heatmapData);
			} else {
				// Use the standard data if we have all results
				updateHeatmap(data);
			}

			// Update search results in store
			const matchResults = data.filter((org: any) => org.isSearchMatch);
			searchStore.update((state) => ({
				...state,
				results: matchResults,
				totalCount: totalCount
			}));

			// Clear and update markers (only using the limited dataset)
			clearMarkers();
			addOrganizationMarkers(data);

			// If we have search results, fit bounds to include them
			if (matchResults.length > 0) {
				fitMapToSearchResults();
			}
		} catch (error) {
			console.error('Error performing search:', error);
			throw error;
		} finally {
			if (loadingIndicator) loadingIndicator.style.display = 'none';
		}
	}

	// Clear search handler
	function handleClearSearch() {
		loadViewportData();
	}

	// Clear search and reset view
	function clearSearch() {
		searchStore.set({ query: '', isSearching: false, results: [] });
		loadViewportData();
	}

	// Fit map to show all search results
	function fitMapToSearchResults() {
		if (!searchResults.length || !map) return;

		const bounds = new google.maps.LatLngBounds();

		searchResults.forEach((result) => {
			bounds.extend(new google.maps.LatLng(result.location.lat, result.location.lng));
		});

		map.fitBounds(bounds, 50); // 50px padding

		// Don't zoom in too far
		if (map.getZoom() > 10) {
			map.setZoom(10);
		}
	}

	// Add markers for organizations with clustering for overlapping points
	function addOrganizationMarkers(data: any[]) {
		// Group organizations by location coordinates
		locationClusters = {};

		data.forEach((org) => {
			// Create a location key for grouping
			const locationKey = `${org.location.lat},${org.location.lng}`;

			if (!locationClusters[locationKey]) {
				locationClusters[locationKey] = [];
			}

			locationClusters[locationKey].push(org);
		});

		// Process each location cluster
		Object.entries(locationClusters).forEach(([locationKey, orgs]) => {
			const [lat, lng] = locationKey.split(',').map(Number);

			// Check if any org in this cluster is a search match
			const hasSearchMatch = orgs.some((org) => org.isSearchMatch);

			if (orgs.length === 1) {
				// Single organization at this location - normal marker
				addSingleMarker(orgs[0], lat, lng, hasSearchMatch);
			} else {
				// Multiple organizations at this location
				const zoom = map.getZoom();

				if (zoom >= SPIDER_LAYOUT_ZOOM) {
					// High zoom level - use spider layout
					addSpiderMarkers(orgs, lat, lng, hasSearchMatch);
				} else {
					// Lower zoom - use cluster marker
					addClusterMarker(orgs, lat, lng, hasSearchMatch);
				}
			}
		});
	}

	// Add a single marker for one organization
	function addSingleMarker(org: any, lat: number, lng: number, isSearchMatch = false) {
		const marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map,
			title: org.name,
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				fillColor: isSearchMatch ? 'rgba(255, 87, 34, 0.8)' : 'rgba(66, 133, 244, 0.8)', // Orange for search matches
				fillOpacity: 0.9,
				strokeWeight: 2,
				strokeColor: isSearchMatch ? '#D84315' : '#FFFFFF',
				scale: isSearchMatch ? 7 : 5 // Larger for search matches
			},
			zIndex: isSearchMatch ? 200 : 100 // Higher z-index for search matches
		});

		marker.addListener('click', () => {
			// Create container for Svelte component
			const container = document.createElement('div');

			// Add project data to props if available
			const props: any = {
				name: org.name,
				organisationID: org.organisationID,
				weight: org.weight
			};

			// Add matching projects if available
			if (org.matchingProjects && org.matchingProjects.length > 0) {
				props.matchingProjects = org.matchingProjects;
			}

			// Mount Svelte component with enhanced props
			mount(OrgPopup, {
				target: container,
				props
			});

			// Create and open InfoWindow
			const infoWindow = new google.maps.InfoWindow({
				content: container,
				maxWidth: 280 // Slightly wider to accommodate project info
			});

			infoWindow.open(map, marker);
			infoWindows.push(infoWindow);

			// Close other open info windows when this one opens
			infoWindows.forEach((iw) => {
				if (iw !== infoWindow) iw.close();
			});
		});

		markers.push(marker);

		// Auto-open popup for search results if there are only a few
		if (isSearchMatch && searchResults.length <= 5) {
			google.maps.event.trigger(marker, 'click');
		}
	}

	// Add a cluster marker for multiple organizations at same location
	function addClusterMarker(orgs: any[], lat: number, lng: number, hasSearchMatch = false) {
		// Create a cluster marker using SVG
		const color = hasSearchMatch ? 'rgba(255, 87, 34, 0.8)' : 'rgba(66, 133, 244, 0.8)'; // Orange for search matches
		const strokeColor = hasSearchMatch ? '#D84315' : 'white';
		const count = orgs.length;
		const size = hasSearchMatch ? 28 : 24; // Larger for search matches

		const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="${strokeColor}" stroke-width="2" />
        <text x="${size / 2}" y="${size / 2 + 4}" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${count}</text>
      </svg>
    `;

		const marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map,
			icon: {
				url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
				anchor: new google.maps.Point(size / 2, size / 2),
				scaledSize: new google.maps.Size(size, size)
			},
			zIndex: hasSearchMatch ? 210 : 110
		});

		marker.addListener('click', () => {
			// Create custom HTML content for cluster popup
			const content = document.createElement('div');
			content.className = 'org-cluster-popup';

			const title = document.createElement('h3');
			title.textContent = `${orgs.length} Organizations at this location`;
			title.style.margin = '0 0 10px 0';
			title.style.fontFamily = 'Arial, sans-serif';
			title.style.fontSize = '14px';
			title.style.color = 'black';

			const list = document.createElement('ul');
			list.style.padding = '0';
			list.style.margin = '0';
			list.style.listStyle = 'none';

			// Limit to showing max 5 organizations
			const displayOrgs = orgs.slice(0, 5);
			const remainingOrgs = orgs.length - 5;

			displayOrgs.forEach((org) => {
				const item = document.createElement('li');
				item.style.padding = '8px 0';
				item.style.borderBottom = '1px solid #eee';
				item.style.color = 'black';

				const name = document.createElement('strong');
				name.textContent = org.name;
				name.style.color = 'black';

				const contribution = document.createElement('div');
				contribution.textContent = `Contribution: €${formatNumber(org.weight)}`;
				contribution.style.fontSize = '12px';
				contribution.style.color = 'black';

				const id = document.createElement('div');
				id.textContent = `ID: ${org.organisationID}`;
				id.style.fontSize = '12px';
				id.style.color = 'black';

				item.appendChild(name);
				item.appendChild(contribution);
				item.appendChild(id);
				list.appendChild(item);
			});

			// Add a "more organizations" indicator if needed
			if (remainingOrgs > 0) {
				const moreItem = document.createElement('li');
				moreItem.style.textAlign = 'center';
				moreItem.style.fontStyle = 'italic';
				moreItem.style.color = '#666';
				moreItem.style.padding = '8px 0';
				moreItem.textContent = `+${remainingOrgs} more organizations`;
				list.appendChild(moreItem);
			}

			content.appendChild(title);
			content.appendChild(list);

			const infoWindow = new google.maps.InfoWindow({
				content: content,
				maxWidth: 300
			});

			infoWindow.open(map, marker);
			infoWindows.push(infoWindow);

			// Close other open info windows when this one opens
			infoWindows.forEach((iw) => {
				if (iw !== infoWindow) iw.close();
			});
		});

		markers.push(marker);
	}

	// Create a "spider" layout for multiple markers at same location when zoomed in
	function addSpiderMarkers(orgs: any[], lat: number, lng: number, hasSearchMatch = false) {
		// Calculate positions in a spiral/circle pattern around the center point
		const numPoints = orgs.length;
		const spiralRadius = 0.0002 * Math.min(16, numPoints);

		orgs.forEach((org, index) => {
			// Calculate position in the spiral
			const angle = (index / numPoints) * 2 * Math.PI;
			const radiusFactor = 1 - (index / numPoints) * 0.5; // Varies the radius slightly

			const offsetLat = lat + Math.sin(angle) * spiralRadius * radiusFactor;
			const offsetLng = lng + Math.cos(angle) * spiralRadius * radiusFactor;

			// Generate a unique color for this marker based on search status
			const isOrgSearchMatch = org.isSearchMatch === true;
			let hue = (index * 137.5) % 360; // Default color distribution

			// Override with orange for search matches
			if (isOrgSearchMatch) {
				hue = 25; // Orange hue
			}

			const fillColor = isOrgSearchMatch ? `rgba(255, 87, 34, 0.8)` : `hsla(${hue}, 70%, 60%, 0.7)`;

			const strokeColor = isOrgSearchMatch ? `#D84315` : `hsl(${hue}, 70%, 40%)`;

			// Create the marker
			const marker = new google.maps.Marker({
				position: new google.maps.LatLng(offsetLat, offsetLng),
				map,
				title: org.name,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					fillColor: fillColor,
					fillOpacity: 1,
					strokeWeight: isOrgSearchMatch ? 2 : 1.5,
					strokeColor: strokeColor,
					scale: isOrgSearchMatch ? 6 : 5 // Slightly larger for search matches
				},
				zIndex: isOrgSearchMatch ? 200 : 100
			});

			marker.addListener('click', () => {
				// Create container for Svelte component
				const container = document.createElement('div');

				// Mount Svelte component
				mount(OrgPopup, {
					target: container,
					props: {
						name: org.name,
						organisationID: org.organisationID,
						weight: org.weight
					}
				});

				const infoWindow = new google.maps.InfoWindow({
					content: container,
					maxWidth: 250
				});

				infoWindow.open(map, marker);
				infoWindows.push(infoWindow);

				// Close other open info windows when this one opens
				infoWindows.forEach((iw) => {
					if (iw !== infoWindow) iw.close();
				});
			});

			markers.push(marker);

			// Auto-open popup for search results if there are only a few
			if (isOrgSearchMatch && searchResults.length <= 5) {
				google.maps.event.trigger(marker, 'click');
			}
		});
	}

	// Add variables to track previous map state
	let prevBounds: google.maps.LatLngBounds | null = null;
	const HIGH_ZOOM_THRESHOLD = 14; // Consider this "zoomed in really far"
	const MOVEMENT_TOLERANCE = 0.01; // Small movement threshold (in degrees)

	// Define the throttled load data function
	const throttledLoadData = throttle(loadViewportData, 300);

	// Add function to check if movement is significant
	function isSignificantMovement(
		current: google.maps.LatLngBounds,
		previous: google.maps.LatLngBounds | null
	): boolean {
		if (!previous) return true;

		// At high zoom levels, use a smaller threshold to determine significant movement
		const currentZoom = map.getZoom();
		if (currentZoom >= HIGH_ZOOM_THRESHOLD) {
			const currentCenter = map.getCenter();
			if (!currentCenter || !previous.getCenter()) return true;

			// Calculate distance between current and previous centers
			const lonDiff = Math.abs(currentCenter.lng() - previous.getCenter().lng());
			const latDiff = Math.abs(currentCenter.lat() - previous.getCenter().lat());

			// Only consider movement significant if it exceeds our tolerance
			return lonDiff > MOVEMENT_TOLERANCE || latDiff > MOVEMENT_TOLERANCE;
		}

		// At lower zoom levels, always consider movement significant
		return true;
	}

	function initMap() {
		map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
			center: { lat: 50, lng: 10 },
			zoom: 4,
			mapTypeId: 'roadmap',

			// Disable all UI controls
			disableDefaultUI: true, // This removes all controls at once

			// Explicitly disable specific controls for clarity
			zoomControl: false,
			mapTypeControl: false,
			scaleControl: false,
			streetViewControl: false,
			rotateControl: false,
			fullscreenControl: false
		});

		// Create loading indicator
		loadingIndicator = document.createElement('div');
		loadingIndicator.id = 'loading-indicator';
		loadingIndicator.className = 'loading-indicator';
		loadingIndicator.textContent = 'Loading data...';
		loadingIndicator.style.display = 'none';
		loadingIndicator.style.color = 'black';
		document.getElementById('map')?.appendChild(loadingIndicator);

		// Initial data load
		loadViewportData();

		// Add event listeners for map movements with better handling
		map.addListener('idle', () => {
			const bounds = map.getBounds();
			if (!bounds) return;

			// Only reload data if movement is significant
			if (isSignificantMovement(bounds, prevBounds)) {
				throttledLoadData(); // Now this reference will be valid
				// Update previous bounds
				prevBounds = bounds;
			}
		});

		// Handle zoom changes especially for spider layout transitions
		map.addListener('zoom_changed', () => {
			const prevZoom = currentZoom;
			const newZoom = map.getZoom();

			if (
				(prevZoom < SPIDER_LAYOUT_ZOOM && newZoom >= SPIDER_LAYOUT_ZOOM) ||
				(prevZoom >= SPIDER_LAYOUT_ZOOM && newZoom < SPIDER_LAYOUT_ZOOM)
			) {
				// We crossed the spider layout threshold, force refresh
				loadViewportData();
			}
		});
	}

	onMount(() => {
		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
		script.async = true;
		script.defer = true;
		script.onload = initMap;
		document.head.appendChild(script);

		return () => {
			unsubscribe();
		};
	});
</script>

<div id="map" class="relative h-screen w-full"></div>

<MapSearch onSearch={performSearch} onClear={handleClearSearch} />

<style>
	/* We'll keep the global styles since they affect Google Maps elements that can't easily be styled with Tailwind */
	:global(.loading-indicator) {
		position: absolute;
		top: 10px;
		left: 10px;
		padding: 8px 12px;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 4px;
		z-index: 1000;
		font-family: 'Arial', sans-serif;
		font-size: 14px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		pointer-events: none;
	}

	:global(.gm-style-iw) {
		padding: 8px !important;
		color: black !important;
	}

	:global(.org-cluster-popup) {
		font-family: 'Arial', sans-serif;
		padding: 5px;
		color: black;
		/* Remove any potential scrolling */
		overflow: hidden;
	}

	:global(.org-cluster-popup h3) {
		margin: 0 0 5px;
		color: black;
		font-size: 14px;
	}
</style>
