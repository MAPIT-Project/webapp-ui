<script lang="ts">
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { HeatmapLayer } from '@deck.gl/aggregation-layers';
    import { MapboxOverlay } from '@deck.gl/mapbox';
    import 'mapbox-gl/dist/mapbox-gl.css';
  
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibm9haDAzMCIsImEiOiJjbTh3MWJ1MDEwM2tjMm1zY3M0ZnQ5d2tmIn0.dbAAz3NWwMiBEUGNTZQQlQ';
    const MIN_ZOOM_FOR_MARKERS = 7;
    const SPIDER_LAYOUT_ZOOM = 12; // At this zoom level or higher, switch to spider layout
  
    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let markers: mapboxgl.Marker[] = [];
    let loadingData = false;
    let currentZoom = 4;
    let overlay: any;
    
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
      
      // Only load markers if we're zoomed in enough
      if (zoom < MIN_ZOOM_FOR_MARKERS) {
        clearAllMarkers();
        // Still update the heatmap even if not showing markers
        try {
          const url = `/api/heatmap?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&zoom=${zoom}`;
          const data = await fetch(url).then((res) => res.json());
          updateHeatmapData(data);
        } catch (error) {
          console.error("Error updating heatmap data:", error);
        }
        return;
      }
      
      loadingData = true;
      document.getElementById('loading-indicator')?.classList.remove('hidden');
      
      try {
        // Build URL with viewport bounds
        const url = `/api/heatmap?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&zoom=${zoom}`;
        const data = await fetch(url).then((res) => res.json());
        
        // Clear existing markers
        clearAllMarkers();
        
        // Add new markers for this viewport
        addOrganizationMarkers(map, data);
        
        // Update the heatmap data as well
        updateHeatmapData(data);
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
            getWeight: (d: any) => d.weight,
            radiusPixels: 40,
            aggregation: 'SUM'
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
        style: 'mapbox://styles/mapbox/light-v10',
        center: [10, 50],
        zoom: 4
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
        
        // Create a deck.gl overlay
        overlay = new MapboxOverlay({
          layers: [
            new HeatmapLayer({
              id: 'deckgl-heatmap',
              data: initialData,
              getPosition: (d: any) => [d.location.lng, d.location.lat],
              getWeight: (d: any) => d.weight,
              radiusPixels: 40,
              aggregation: 'SUM',
              pickable: true
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
      map.on('moveend', throttledLoadData);
      
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
        
        if (orgs.length === 1) {
          // Single organization at this location - normal marker
          addSingleMarker(mapInstance, orgs[0], lng, lat);
        } else {
          // Multiple organizations at this location
          const zoom = mapInstance.getZoom();
          
          if (zoom >= SPIDER_LAYOUT_ZOOM) {
            // High zoom level - use spider layout
            addSpiderMarkers(mapInstance, orgs, lng, lat);
          } else {
            // Lower zoom - use cluster marker
            addClusterMarker(mapInstance, orgs, lng, lat);
          }
        }
      });
    }
    
    // Add a single marker for one organization
    function addSingleMarker(mapInstance: mapboxgl.Map, org: any, lng: number, lat: number) {
      const markerEl = document.createElement('div');
      markerEl.className = 'org-marker';
      
      const popup = createPopupForOrg(org);
      
      const marker = new mapboxgl.Marker({
        element: markerEl,
        scale: 0.8,
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstance);
      
      markers.push(marker);
    }
    
    // Add a cluster marker representing multiple organizations
    function addClusterMarker(mapInstance: mapboxgl.Map, orgs: any[], lng: number, lat: number) {
      const markerEl = document.createElement('div');
      markerEl.className = 'org-cluster-marker';
      markerEl.innerHTML = `<span>${orgs.length}</span>`;
      
      // Create a popup that lists all organizations in the cluster
      const popupContent = `
        <div class="org-popup org-cluster-popup">
          <h3>${orgs.length} Organizations at this location</h3>
          <ul class="org-list">
            ${orgs.map(org => `
              <li>
                <strong>${org.name}</strong>
                <div>Contribution: €${formatNumber(org.weight)}</div>
                <div>ID: ${org.organisationID}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      
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
    function addSpiderMarkers(mapInstance: mapboxgl.Map, orgs: any[], lng: number, lat: number) {
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
        markerEl.className = 'org-marker spider-marker';
        
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
      return new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        className: 'org-popup-container'
      }).setHTML(`
        <div class="org-popup">
          <h3>${org.name}</h3>
          <p><strong>Contribution:</strong> €${formatNumber(org.weight)}</p>
          <p><strong>ID:</strong> ${org.organisationID}</p>
        </div>
      `);
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
      };
    });
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
      max-height: 300px;
      overflow-y: auto;
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
    }
    
    :global(.org-popup h3) {
      margin: 0 0 5px;
      color: #333;
      font-size: 14px;
    }
    
    :global(.org-popup p) {
      margin: 3px 0;
      font-size: 12px;
    }
    
    :global(.mapboxgl-popup-content) {
      padding: 12px;
      border-radius: 4px;
      max-width: 250px;
    }
</style>
  
<div class="map-wrapper">
  <div id="map" bind:this={mapContainer}></div>
</div>