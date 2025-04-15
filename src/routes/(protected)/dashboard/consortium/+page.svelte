<script lang="ts">
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { HeatmapLayer } from '@deck.gl/aggregation-layers';
    import { MapboxOverlay } from '@deck.gl/mapbox';
    import { searchStore } from '$lib/stores/searchStore';
    import MapSearch from '$components/MapSearch.svelte';
    import 'mapbox-gl/dist/mapbox-gl.css';
  
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibm9haDAzMCIsImEiOiJjbTh3MWJ1MDEwM2tjMm1zY3M0ZnQ5d2tmIn0.dbAAz3NWwMiBEUGNTZQQlQ';
    const MIN_ZOOM_FOR_MARKERS = 7;
    const SPIDER_LAYOUT_ZOOM = 12; // At this zoom level or higher, switch to spider layout
    const HIGH_ZOOM_THRESHOLD = 14; // Consider this "zoomed in really far"
    const MOVEMENT_TOLERANCE = 0.01; // Small movement threshold (in degrees)
  
    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let markers: mapboxgl.Marker[] = [];
    let loadingData = false;
    let currentZoom = 4;
    let overlay: any;
    let prevBounds: mapboxgl.LngLatBounds | null = null;
    
    // Track the current viewport's organization clusters
    let locationClusters: Record<string, any[]> = {};
    
    // Throttle function to prevent too many API calls
    function throttle(fn: Function, delay: number) {
      let lastCall = 0;
      return function(...args: any[]) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
          return;
        }
        lastCall = now;
        return fn(...args);
      }
    }
    
    let searchQuery = '';
    let searchResults: any[] = [];
    let isSearching = false;
    
    // Set up subscription to the search store
    const unsubscribe = searchStore.subscribe(state => {
        searchQuery = state.query;
        searchResults = state.results;
        isSearching = state.isSearching;
    });
    
    // Perform search functionality - now exposed for the MapSearch component
    async function performSearch() {
        document.getElementById('loading-indicator')?.classList.remove('hidden');
        
        try {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            
            // Standard request for markers (limited to 1000 points)
            const url = `/api/heatmap?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&zoom=${zoom}&search=${encodeURIComponent(searchQuery.trim())}`;
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
                updateHeatmapData(heatmapData);
            } else {
                // Use the standard data if we have all results
                updateHeatmapData(data);
            }
            
            // Update search results in store
            const matchResults = data.filter((org: any) => org.isSearchMatch);
            searchStore.update(state => ({ 
              ...state, 
              results: matchResults,
              totalCount: totalCount
            }));
            
            // Clear and update markers (only using the limited dataset)
            clearAllMarkers();
            addOrganizationMarkers(map, data);
            
            // If we have search results, fit bounds to include them
            if (matchResults.length > 0) {
                fitMapToSearchResults();
            }
        } catch (error) {
            console.error("Error performing search:", error);
            throw error;
        } finally {
            document.getElementById('loading-indicator')?.classList.add('hidden');
        }
    }
    
    // Clear search handler
    function handleClearSearch() {
        loadViewportData();
    }
    
    // Fit map to show all search results
    function fitMapToSearchResults() {
        if (!searchResults.length) return;
        
        const bounds = new mapboxgl.LngLatBounds();
        
        searchResults.forEach(result => {
            bounds.extend([result.location.lng, result.location.lat]);
        });
        
        map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 10
        });
    }
    
    // Load data based on current viewport
    async function loadViewportData() {
      if (loadingData || !map) return;
      
      const bounds = map.getBounds();
      if (!bounds) {
        console.log("Map bounds not available");
        return;
      };
      
      const zoom = map.getZoom();
      currentZoom = zoom;
      
      loadingData = true;
      document.getElementById('loading-indicator')?.classList.remove('hidden');
      
      try {
        // Check if we have an active search
        const currentSearch = searchQuery.trim();
        
        // Build URL with viewport bounds and include search if present
        let url = `/api/heatmap?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&zoom=${zoom}`;
        
        // Append search parameters if we have an active search
        if (currentSearch) {
          url += `&search=${encodeURIComponent(currentSearch)}`;
        }
        
        // Fetch regular data for markers (limited)
        const response = await fetch(url).then((res) => res.json());
        
        // Handle the new API response structure
        const data = response.results || [];
        const totalCount = response.totalCount || 0;
        
        // Clear existing markers
        clearAllMarkers();
        
        // For low zoom levels, get more comprehensive data for heatmap
        if (zoom < 6) {
          // Fetch heatmap-optimized data (more points, no extra details)
          const heatmapUrl = `${url}&heatmapOnly=true`;
          const heatmapResponse = await fetch(heatmapUrl).then((res) => res.json());
          const heatmapData = heatmapResponse.results || [];
          
          // Update heatmap with more comprehensive data
          updateHeatmapData(heatmapData);
        } else {
          // At higher zoom levels, we can use the same data for both
          updateHeatmapData(data);
        }
        
        // Only add markers if we're zoomed in enough
        if (zoom >= MIN_ZOOM_FOR_MARKERS) {
          // Add new markers for this viewport
          addOrganizationMarkers(map, data);
        }
        
        // Update search results if we have an active search
        if (currentSearch) {
          const matchResults = data.filter((org: any) => org.isSearchMatch);
          searchStore.update(state => ({ 
            ...state, 
            results: matchResults,
            totalCount: totalCount 
          }));
        }
      } catch (error) {
        console.error("Error loading viewport data:", error);
      } finally {
        loadingData = false;
        document.getElementById('loading-indicator')?.classList.add('hidden');
      }
    }
    
    // Clear all existing markers
    function clearAllMarkers() {
      markers.forEach(marker => marker.remove());
      markers = [];
      locationClusters = {};
    }
    
    // Update the heatmap with new data
    function updateHeatmapData(data: any[]) {
      if (!overlay || !data.length) return;
      
      // Update the heatmap layer with new data
      const deckOverlay = overlay._deck;
      if (deckOverlay) {
        const newLayers = [
          new HeatmapLayer({
            id: 'deckgl-heatmap',
            data,
            getPosition: (d: any) => [d.location.lng, d.location.lat],
            getWeight: (d: any) => d.weight * 3, // Increase multiplier from 2 to 3
            radiusPixels: 80, // Increase radius from 60 to 80
            aggregation: 'SUM',
            threshold: 0.03, // Lower threshold from 0.05 to 0.03 to show more low-density areas
            intensity: 3.5, // Adjusted from 4 to 3.5
            // Modified color range for more gradual transition to red
            colorRange: [
              [0, 0, 255, 0],       // Transparent blue (start)
              [0, 0, 255, 51],      // Light blue
              [0, 110, 255, 102],   // Medium blue
              [0, 170, 255, 153],   // Cyan-blue
              [0, 220, 255, 178],   // Cyan
              [0, 255, 200, 204],   // Cyan-green
              [0, 255, 100, 229],   // Green
              [170, 255, 0, 242],   // Yellow-green
              [255, 240, 0, 255],   // Yellow
              [255, 170, 0, 255],   // Orange
              [255, 80, 0, 255],    // Red-orange
              [255, 0, 0, 255]      // Red (end)
            ],
            updateTriggers: {
              getWeight: data  // Ensure updates when data changes
            }
          })
        ];
        
        deckOverlay.setProps({ layers: newLayers });
      }
    }
    
    // Initialize the map
    async function initMap() {
      mapboxgl.accessToken = MAPBOX_TOKEN;
  
      map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/dark-v10', // Changed from light to dark for better contrast
        center: [10, 50],
        zoom: 4,
        attributionControl: false // Disable the attribution control
      });
      
      // Add loading indicator
      const loadingEl = document.createElement('div');
      loadingEl.id = 'loading-indicator';
      loadingEl.className = 'loading-indicator hidden';
      loadingEl.textContent = 'Loading data...';
      mapContainer.appendChild(loadingEl);
      
      // Wait for map tiles/styles to finish loading
      map.on('load', async () => {
        // Initial data load for heatmap
        const initialData = await fetch('/api/heatmap?zoom=1').then((res) => res.json());
        
        // Get either the results array or the data itself
        const heatmapData = initialData.results || initialData;
        
        // Create a deck.gl overlay
        overlay = new MapboxOverlay({
          layers: [
            new HeatmapLayer({
              id: 'deckgl-heatmap',
              data: heatmapData,
              getPosition: (d: any) => [d.location.lng, d.location.lat],
              getWeight: (d: any) => d.weight * 3, // Weight multiplier
              radiusPixels: 80, // Larger radius for better spread
              aggregation: 'SUM',
              threshold: 0.03, // Threshold
              intensity: 3.5, // Adjusted intensity
              pickable: true,
              // Modified color range to match the update function
              colorRange: [
                [0, 0, 255, 0],       // Transparent blue (start)
                [0, 0, 255, 51],      // Light blue
                [0, 110, 255, 102],   // Medium blue
                [0, 170, 255, 153],   // Cyan-blue
                [0, 220, 255, 178],   // Cyan
                [0, 255, 200, 204],   // Cyan-green
                [0, 255, 100, 229],   // Green
                [170, 255, 0, 242],   // Yellow-green
                [255, 240, 0, 255],   // Yellow
                [255, 170, 0, 255],   // Orange
                [255, 80, 0, 255],    // Red-orange
                [255, 0, 0, 255]      // Red (end)
              ]
            })
          ]
        });
        
        // Add the overlay to the map
        map.addControl(overlay);
        
        // First load of data
        loadViewportData();
      });
      
      // Add event listeners for viewport changes
      const throttledLoadData = throttle(loadViewportData, 300);
      map.on('zoomend', () => {
        // If crossing the SPIDER_LAYOUT_ZOOM threshold, we want to refresh markers
        const prevZoom = currentZoom;
        const newZoom = map.getZoom();
        
        if ((prevZoom < SPIDER_LAYOUT_ZOOM && newZoom >= SPIDER_LAYOUT_ZOOM) ||
            (prevZoom >= SPIDER_LAYOUT_ZOOM && newZoom < SPIDER_LAYOUT_ZOOM)) {
          // We crossed the spider layout threshold, force refresh
          throttledLoadData();
        } else {
          // Normal zoom change
          throttledLoadData();
        }
      });
      map.on('moveend', () => {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        
        // Only reload data if movement is significant
        if (isSignificantMovement(bounds, prevBounds)) {
          throttledLoadData();
          // Update previous bounds
          prevBounds = bounds.clone();
        } else {
          // Just reposition existing markers without loading new data
          repositionMarkers();
        }
      });
      
      // Fix for marker positioning during zoom - refresh markers on zoom change
      map.on('zoom', () => {
        // Reposition markers during active zooming for better alignment
        if (markers.length > 0 && map.getZoom() >= MIN_ZOOM_FOR_MARKERS) {
          repositionMarkers();
        }
      });
    }
    
    // Function to reposition markers during zoom
    function repositionMarkers() {
      markers.forEach(marker => {
        // Get current position and force update
        const lngLat = marker.getLngLat();
        marker.setLngLat([lngLat.lng, lngLat.lat]);
      });
    }
    
    // Add markers for organizations with clustering for overlapping points
    function addOrganizationMarkers(mapInstance: mapboxgl.Map, data: any[]) {
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
        const hasSearchMatch = orgs.some(org => org.isSearchMatch);
        
        if (orgs.length === 1) {
          // Single organization at this location - normal marker
          addSingleMarker(mapInstance, orgs[0], lng, lat, hasSearchMatch);
        } else {
          // Multiple organizations at this location
          const zoom = mapInstance.getZoom();
          
          if (zoom >= SPIDER_LAYOUT_ZOOM) {
            // High zoom level - use spider layout
            addSpiderMarkers(mapInstance, orgs, lng, lat, hasSearchMatch);
          } else {
            // Lower zoom - use cluster marker
            addClusterMarker(mapInstance, orgs, lng, lat, hasSearchMatch);
          }
        }
      });
    }
    
    // Add a single marker for one organization
    function addSingleMarker(mapInstance: mapboxgl.Map, org: any, lng: number, lat: number, isSearchMatch = false) {
      const markerEl = document.createElement('div');
      markerEl.className = isSearchMatch ? 'org-marker search-match' : 'org-marker';
      
      const popup = createPopupForOrg(org);
      
      const marker = new mapboxgl.Marker({
        element: markerEl,
        scale: isSearchMatch ? 1.2 : 0.8, // Make search matches slightly larger
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstance);
      
      markers.push(marker);
      
      // Auto-open popup for search results if there are only a few
      if (isSearchMatch && searchResults.length <= 5) {
        marker.togglePopup();
      }
    }
    
    // Add a cluster marker representing multiple organizations
    function addClusterMarker(mapInstance: mapboxgl.Map, orgs: any[], lng: number, lat: number, hasSearchMatch = false) {
      const markerEl = document.createElement('div');
      markerEl.className = hasSearchMatch ? 'org-cluster-marker search-match' : 'org-cluster-marker';
      markerEl.innerHTML = `<span>${orgs.length}</span>`;
      
      // Create a popup that lists all organizations in the cluster
      let popupContent = `
        <div class="org-popup org-cluster-popup text-black">
          <h3 class="text-black">${orgs.length} Organizations at this location</h3>
      `;
      
      // Limit to showing max 5 organizations to avoid scrolling
      const displayOrgs = orgs.slice(0, 5);
      const remainingOrgs = orgs.length - 5;
      
      popupContent += `<ul class="org-list">`;
      
      displayOrgs.forEach(org => {
        popupContent += `
          <li>
            <strong class="text-black">${org.name}</strong>
            <div class="text-black">Contribution: €${formatNumber(org.weight)}</div>
            <div class="text-black">ID: ${org.organisationID}</div>
          </li>
        `;
      });
      
      // Show count of additional orgs if more than 5
      if (remainingOrgs > 0) {
        popupContent += `
          <li class="text-gray-700 italic text-center">
            +${remainingOrgs} more organizations
          </li>
        `;
      }
      
      popupContent += `</ul></div>`;
      
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        maxWidth: '300px',
        className: 'org-popup-container'
      }).setHTML(popupContent);
      
      const marker = new mapboxgl.Marker({
        element: markerEl,
        scale: 1,
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstance);
      
      markers.push(marker);
    }
    
    // Create a "spider" layout for multiple markers at the same location
    function addSpiderMarkers(mapInstance: mapboxgl.Map, orgs: any[], lng: number, lat: number, hasSearchMatch = false) {
      // Calculate positions in a spiral/circle pattern around the center point
      const numPoints = orgs.length;
      const spiralRadius = 0.0002 * Math.min(16, numPoints); // Scale radius based on count, with a max
      
      orgs.forEach((org, index) => {
        // Calculate position in the spiral
        const angle = (index / numPoints) * 2 * Math.PI;
        const radiusFactor = 1 - (index / numPoints) * 0.5; // Varies the radius slightly
        
        const offsetLng = lng + Math.cos(angle) * spiralRadius * radiusFactor;
        const offsetLat = lat + Math.sin(angle) * spiralRadius * radiusFactor;
        
        // Create the marker
        const markerEl = document.createElement('div');
        const isOrgSearchMatch = org.isSearchMatch === true;
        markerEl.className = isOrgSearchMatch 
            ? 'org-marker spider-marker search-match' 
            : 'org-marker spider-marker';
        
        // Add organization-specific color to differentiate them
        const hue = (index * 137.5) % 360; // Use golden angle for even distribution
        markerEl.style.backgroundColor = `hsla(${hue}, 70%, 60%, 0.7)`;
        markerEl.style.borderColor = `hsl(${hue}, 70%, 40%)`;
        
        const popup = createPopupForOrg(org);
        
        const marker = new mapboxgl.Marker({
          element: markerEl,
          scale: 0.7, // Slightly smaller to reduce overlap
          anchor: 'center',
          pitchAlignment: 'map',
          rotationAlignment: 'map'
        })
          .setLngLat([offsetLng, offsetLat])
          .setPopup(popup)
          .addTo(mapInstance);
        
        markers.push(marker);
      });
    }
    
    // Helper function to create popup for a single organization
    function createPopupForOrg(org: any) {
      let popupContent = `
        <div class="org-popup text-black">
          <h3 class="text-black">${org.name}</h3>
          <p><strong>Organization ID:</strong> ${org.organisationID}</p>
          <p><strong>Total Contribution:</strong> €${formatNumber(org.weight)}</p>
      `;
      
      // Add matching projects information if available
      if (org.matchingProjects && org.matchingProjects.length > 0) {
        popupContent += `
          <div class="matching-projects">
            <h4 class="text-black">Matching Projects (${org.matchingProjects.length}):</h4>
            <ul class="project-list">
        `;
        
        // List up to 3 projects in the popup
        const displayProjects = org.matchingProjects.slice(0, 3);
        displayProjects.forEach(project => {
          popupContent += `
            <li>
              <div class="project-title text-black">${project.title}</div>
              <div class="project-contribution">€${formatNumber(project.contribution)}</div>
            </li>
          `;
        });
        
        // If there are more projects, add a note
        if (org.matchingProjects.length > 3) {
          popupContent += `<li class="more-projects text-gray-700">+${org.matchingProjects.length - 3} more projects</li>`;
        }
        
        popupContent += `</ul></div>`;
      }
      
      // Add "View Details" link
      popupContent += `
        <div class="mt-3 text-center">
          <a href="/organization/${org.organisationID}" class="view-details-link bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
            View Organization Details
          </a>
        </div>
      `;
      
      popupContent += `</div>`;
      
      return new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        className: 'org-popup-container text-black'
      }).setHTML(popupContent);
    }
    
    function formatNumber(num: number): string {
      return new Intl.NumberFormat('en-EU', { 
        maximumFractionDigits: 0 
      }).format(num);
    }
  
    onMount(() => {
      initMap();
      
      // Cleanup when component is destroyed
      return () => {
        if (map) {
          map.remove();
        }
        unsubscribe();
      };
    });

    // Add function to check if movement is significant
    function isSignificantMovement(current: mapboxgl.LngLatBounds, previous: mapboxgl.LngLatBounds | null): boolean {
      if (!previous) return true;
      
      // At high zoom levels, use a smaller threshold to determine significant movement
      const currentZoom = map.getZoom();
      if (currentZoom >= HIGH_ZOOM_THRESHOLD) {
        const currentCenter = map.getCenter();
        const prevCenter = new mapboxgl.LngLat(
          (previous.getWest() + previous.getEast()) / 2,
          (previous.getNorth() + previous.getSouth()) / 2
        );
        
        // Calculate distance between current and previous centers
        const lonDiff = Math.abs(currentCenter.lng - prevCenter.lng);
        const latDiff = Math.abs(currentCenter.lat - prevCenter.lat);
        
        // Only consider movement significant if it exceeds our tolerance
        return lonDiff > MOVEMENT_TOLERANCE || latDiff > MOVEMENT_TOLERANCE;
      }
      
      // At lower zoom levels, always consider movement significant
      return true;
    }
</script>
  
<style>
    :global(body) {
      margin: 0;
      padding: 0;
    }
  
    #map {
      width: 100%;
      height: 100%;
      position: relative;
      margin: 0;
    }

    .map-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    
    /* Marker styling */
    :global(.org-marker) {
      background-color: rgba(66, 133, 244, 0.7); /* 70% opacity */
      border: 2px solid white;
      border-radius: 50%;
      width: 10px; /* Slightly smaller to improve precision */
      height: 10px;
      cursor: pointer;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
      /* Ensure markers are on top */
      z-index: 10;
    }
    
    /* Spider marker variant */
    :global(.spider-marker) {
      /* These will get custom colors via inline style */
      width: 12px;  /* Increased from 8px to 12px */
      height: 12px; /* Increased from 8px to 12px */
      border: 2px solid; /* Increased from 1.5px to 2px */
    }
    
    /* Cluster marker styling */
    :global(.org-cluster-marker) {
      background-color: rgba(66, 133, 244, 0.8);
      border: 2px solid white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
      z-index: 10;
      font-family: 'Arial', sans-serif;
      font-weight: bold;
      font-size: 12px;
      color: white;
    }
    
    /* Styling for organization list in cluster popup */
    :global(.org-cluster-popup) {
      max-height: none; /* Remove scrolling */
      overflow-y: hidden;
    }
    
    :global(.org-list) {
      list-style: none;
      padding: 0;
      margin: 5px 0 0 0;
    }
    
    :global(.org-list li) {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    :global(.org-list li:last-child) {
      border-bottom: none;
    }
    
    /* Ensure mapboxgl-marker class has high z-index and proper positioning */
    :global(.mapboxgl-marker) {
      z-index: 200 !important;
      will-change: transform; /* Optimize for animations/transitions */
    }
    
    /* Make popup have high z-index too */
    :global(.mapboxgl-popup) {
      z-index: 300 !important;
    }
    
    /* Loading indicator */
    :global(.loading-indicator) {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 8px 12px;
      background-color: rgba(255, 255, 255, 0.9);
      color: black;
      border-radius: 4px;
      z-index: 1000; /* Ensure it's on top */
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
      pointer-events: none;
    }
    
    :global(.hidden) {
      display: none;
    }
    
    /* Popup styling */
    :global(.org-popup) {
      padding: 5px;
      font-family: 'Arial', sans-serif;
      color: black;
    }
    
    :global(.org-popup h3) {
      margin: 0 0 5px;
      color: #333;
      font-size: 14px;
    }
    
    :global(.org-popup p) {
      margin: 3px 0;
      font-size: 12px;
      color: black;
    }
    
    :global(.mapboxgl-popup-content) {
      padding: 12px;
      border-radius: 4px;
      max-width: 250px;
    }
    
    /* Search match styling */
    :global(.org-marker.search-match) {
        background-color: rgba(255, 87, 34, 0.7) !important; /* Orange for search matches */
        border-color: #D84315 !important;
        box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.4), 0 0 8px rgba(0, 0, 0, 0.4) !important;
        z-index: 150 !important; /* Ensure search matches are above other markers */
    }
    
    :global(.org-cluster-marker.search-match) {
        background-color: rgba(255, 87, 34, 0.8) !important;
        border-color: #D84315 !important;
        box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.4), 0 0 8px rgba(0, 0, 0, 0.4) !important;
        z-index: 150 !important;
    }
    
    /* Project list styling */
    :global(.matching-projects h4) {
      margin: 12px 0 5px;
      font-size: 13px;
      color: #333;
    }
    
    :global(.project-list) {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    :global(.project-list li) {
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    
    :global(.project-list li:last-child) {
      border-bottom: none;
    }
    
    :global(.project-title) {
      font-weight: bold;
    }
    
    :global(.project-contribution) {
      color: #4285F4;
    }
    
    :global(.more-projects) {
      font-style: italic;
      color: #666;
      text-align: right;
    }
</style>

<div class="relative w-full h-screen overflow-hidden">
  <div id="map" class="w-full h-full relative m-0" bind:this={mapContainer}></div>
  
  <MapSearch onSearch={performSearch} onClear={handleClearSearch} />
</div>