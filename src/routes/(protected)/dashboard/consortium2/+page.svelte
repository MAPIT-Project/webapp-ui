<script lang="ts">
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { HeatmapLayer } from '@deck.gl/aggregation-layers';
    import { MapboxOverlay } from '@deck.gl/mapbox';
    import 'mapbox-gl/dist/mapbox-gl.css';
  
    // This should be replaced with a Mapbox api key for this project
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibm9haDAzMCIsImEiOiJjbTh3MWJ1MDEwM2tjMm1zY3M0ZnQ5d2tmIn0.dbAAz3NWwMiBEUGNTZQQlQ';
    const MIN_ZOOM_FOR_MARKERS = 7; // Minimum zoom level to show individual markers
  
    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let markers: mapboxgl.Marker[] = [];
    let loadingData = false;
    let currentZoom = 4;
    let overlay: any;
    
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
      map.on('zoomend', throttledLoadData);
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
    
    // Add markers for organizations
    function addOrganizationMarkers(mapInstance: mapboxgl.Map, data: any[]) {
      // Add markers for each organization
      data.forEach((org) => {
        // Create HTML element for the marker
        const markerEl = document.createElement('div');
        markerEl.className = 'org-marker';
        
        // Create popup with organization info
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: true,
          className: 'org-popup-container'
        })
          .setHTML(`
            <div class="org-popup">
              <h3>${org.name}</h3>
              <p><strong>Contribution:</strong> €${formatNumber(org.weight)}</p>
              <p><strong>ID:</strong> ${org.organisationID}</p>
            </div>
          `);
        
        // Convert coordinates format to match heatmap layer exactly
        const lng = parseFloat(org.location.lng);
        const lat = parseFloat(org.location.lat);
        
        // Add marker to the map with higher z-index
        const marker = new mapboxgl.Marker({
          element: markerEl,
          scale: 0.8,
          anchor: 'center', // Change to center for better alignment with heatmap
          pitchAlignment: 'map', // Keep aligned with map
          rotationAlignment: 'map' // Keep aligned with map
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapInstance);
        
        // Track this marker
        markers.push(marker);
      });
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