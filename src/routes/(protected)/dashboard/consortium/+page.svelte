<script lang="ts">
  import { onMount, mount } from 'svelte';
  import OrgPopup from './components/OrgPopup.svelte';

  const apiKey = 'AIzaSyDh3AuMgN7JAR5vLJHpyZRmvHlVfCzZ7_Y';
  
  const MIN_ZOOM_FOR_MARKERS = 12;  // Minimum zoom level to show markers
  const SPIDER_LAYOUT_ZOOM = 12;   // Zoom level to switch to spider layout
  
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
    return function(...args: any[]) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return fn(...args);
    }
  }

  // Format numbers with proper grouping
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-EU', { 
      maximumFractionDigits: 0 
    }).format(num);
  }
  
  // Clear existing markers and info windows
  function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(window => window.close());
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
    
    // Only load markers if we're zoomed in enough
    if (zoom < MIN_ZOOM_FOR_MARKERS) {
      clearMarkers();
      // Still load heatmap data
      try {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const url = `/api/heatmap?north=${ne.lat()}&south=${sw.lat()}&east=${ne.lng()}&west=${sw.lng()}&zoom=${zoom}`;
        
        const data = await fetch(url).then((res) => res.json());
        updateHeatmap(data);
      } catch (error) {
        console.error("Error updating heatmap data:", error);
      }
      return;
    }
    
    isLoading = true;
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const url = `/api/heatmap?north=${ne.lat()}&south=${sw.lat()}&east=${ne.lng()}&west=${sw.lng()}&zoom=${zoom}`;
      
      const data = await fetch(url).then((res) => res.json());
      
      // Update heatmap and markers
      clearMarkers();
      updateHeatmap(data);
      addOrganizationMarkers(data);
      
    } catch (error) {
      console.error("Error loading viewport data:", error);
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
      
      if (orgs.length === 1) {
        // Single organization at this location - normal marker
        addSingleMarker(orgs[0], lat, lng);
      } else {
        // Multiple organizations at this location
        const zoom = map.getZoom();
        
        if (zoom >= SPIDER_LAYOUT_ZOOM) {
          // High zoom level - use spider layout
          addSpiderMarkers(orgs, lat, lng);
        } else {
          // Lower zoom - use cluster marker
          addClusterMarker(orgs, lat, lng);
        }
      }
    });
  }
  
  // Add a single marker for one organization
  function addSingleMarker(org: any, lat: number, lng: number) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map,
      title: org.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'rgba(66, 133, 244)',
        fillOpacity: 0.8,
        strokeWeight: 1.5, // Reduced stroke weight
        strokeColor: '#FFFFFF',
        scale: 5 // Reduced from 7 to 5 for smaller dots
      },
      zIndex: 100
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

      // Create and open InfoWindow
      const infoWindow = new google.maps.InfoWindow({
        content: container,
        maxWidth: 250
      });
      
      infoWindow.open(map, marker);
      infoWindows.push(infoWindow);
      
      // Close other open info windows when this one opens
      infoWindows.forEach(iw => {
        if (iw !== infoWindow) iw.close();
      });
    });
    
    markers.push(marker);
  }
  
  // Add a cluster marker for multiple organizations at same location
  function addClusterMarker(orgs: any[], lat: number, lng: number) {
    // Create a cluster marker using SVG
    const color = 'rgba(66, 133, 244, 0.8)';
    const count = orgs.length;
    const size = 24;
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2" />
        <text x="${size/2}" y="${size/2 + 4}" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${count}</text>
      </svg>
    `;
    
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        anchor: new google.maps.Point(size/2, size/2),
        scaledSize: new google.maps.Size(size, size)
      },
      zIndex: 110
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
      
      const list = document.createElement('ul');
      list.style.padding = '0';
      list.style.margin = '0';
      list.style.listStyle = 'none';
      list.style.maxHeight = '200px';
      list.style.overflowY = 'auto';
      
      orgs.forEach(org => {
        const item = document.createElement('li');
        item.style.padding = '8px 0';
        item.style.borderBottom = '1px solid #eee';
        
        const name = document.createElement('strong');
        name.textContent = org.name;
        
        const contribution = document.createElement('div');
        contribution.textContent = `Contribution: €${formatNumber(org.weight)}`;
        contribution.style.fontSize = '12px';
        
        const id = document.createElement('div');
        id.textContent = `ID: ${org.organisationID}`;
        id.style.fontSize = '12px';
        
        item.appendChild(name);
        item.appendChild(contribution);
        item.appendChild(id);
        list.appendChild(item);
      });
      
      content.appendChild(title);
      content.appendChild(list);
      
      const infoWindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
      });
      
      infoWindow.open(map, marker);
      infoWindows.push(infoWindow);
      
      // Close other open info windows when this one opens
      infoWindows.forEach(iw => {
        if (iw !== infoWindow) iw.close();
      });
    });
    
    markers.push(marker);
  }
  
  // Create a "spider" layout for multiple markers at same location when zoomed in
  function addSpiderMarkers(orgs: any[], lat: number, lng: number) {
    // Calculate positions in a spiral/circle pattern around the center point
    const numPoints = orgs.length;
    const spiralRadius = 0.0002 * Math.min(16, numPoints);
    
    orgs.forEach((org, index) => {
      // Calculate position in the spiral
      const angle = (index / numPoints) * 2 * Math.PI;
      const radiusFactor = 1 - (index / numPoints) * 0.5; // Varies the radius slightly
      
      const offsetLat = lat + Math.sin(angle) * spiralRadius * radiusFactor;
      const offsetLng = lng + Math.cos(angle) * spiralRadius * radiusFactor;
      
      // Generate a unique color for this marker
      const hue = (index * 137.5) % 360; // Use golden angle for even distribution
      const fillColor = `hsla(${hue}, 70%, 60%, 0.7)`;
      const strokeColor = `hsl(${hue}, 70%, 40%)`;
      
      // Create the marker
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(offsetLat, offsetLng),
        map,
        title: org.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: fillColor,
          fillOpacity: 1,
          strokeWeight: 1.5,  // Increased from 1 to 1.5
          strokeColor: strokeColor,
          scale: 5  // Increased from 3.5 to 5 for larger spider dots
        },
        zIndex: 100
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
        infoWindows.forEach(iw => {
          if (iw !== infoWindow) iw.close();
        });
      });
      
      markers.push(marker);
    });
  }

  function initMap() {
    map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 50, lng: 10 },
      zoom: 4,
      mapTypeId: 'roadmap',
      mapTypeControl: false
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
    
    // Add event listeners for map movements with throttling
    const throttledLoadData = throttle(loadViewportData, 300);
    map.addListener('idle', throttledLoadData);
    
    // Handle zoom changes especially for spider layout transitions
    map.addListener('zoom_changed', () => {
      const prevZoom = currentZoom;
      const newZoom = map.getZoom();
      
      if ((prevZoom < SPIDER_LAYOUT_ZOOM && newZoom >= SPIDER_LAYOUT_ZOOM) ||
          (prevZoom >= SPIDER_LAYOUT_ZOOM && newZoom < SPIDER_LAYOUT_ZOOM)) {
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
  });
</script>

<style>
  #map {
    width: 100%;
    height: 100vh;
    position: relative;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }
  
  /* Add CSS for loading indicator */
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
  
  /* Style the Google Maps InfoWindow */
  :global(.gm-style-iw) {
    padding: 8px !important;
  }
  
  /* Style the organization list in the cluster popup */
  :global(.org-cluster-popup) {
    font-family: 'Arial', sans-serif;
    padding: 5px;
  }
  
  :global(.org-cluster-popup h3) {
    margin: 0 0 5px;
    color: #333;
    font-size: 14px;
  }
</style>

<div id="map"></div>
