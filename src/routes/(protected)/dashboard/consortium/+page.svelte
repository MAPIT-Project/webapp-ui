<script lang="ts">
  import { onMount, mount } from 'svelte';
  import OrgPopup from './components/OrgPopup.svelte';

  const apiKey = 'AIzaSyDh3AuMgN7JAR5vLJHpyZRmvHlVfCzZ7_Y';

  let map: google.maps.Map;
  let heatmap: google.maps.visualization.HeatmapLayer;

  async function loadHeatmapData() {
    const res = await fetch('/api/heatmap');
    const rawData = await res.json();

    // Weighted points for heatmap
    const heatmapPoints = rawData.map((entry) => ({
      location: new google.maps.LatLng(entry.location.lat, entry.location.lng),
      weight: entry.weight
    }));

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapPoints,
      radius: 30,
      dissipating: true,
      opacity: 1.0, // Maximum opacity for stronger colors
      gradient: [
        'rgba(0, 0, 255, 0)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 255, 0, 1)',
        'rgba(255, 255, 0, 1)',
        'rgba(255, 0, 0, 1)'
      ] // Custom gradient with more intense colors
    });

    heatmap.setMap(map);

    // Add click markers with info windows
    rawData.forEach((entry) => {
      const { lat, lng } = entry.location;
      const position = new google.maps.LatLng(lat, lng);

      // Create a visible marker instead of an invisible one
      const marker = new google.maps.Marker({
        position,
        map,
        title: entry.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 0.3, // Changed from 0.9 to 0.2 (20% opacity)
          strokeWeight: 0.5,
          strokeColor: '#FFFFFF',
          scale: 3 // Make the marker visible with a reasonable size
        }
      });

      marker.addListener('click', () => {
        // Create container for Svelte component
        const container = document.createElement('div');
        
        // Create and mount Svelte component using mount function
        mount(OrgPopup, {
          target: container,
          props: {
            name: entry.name,
            organisationID: entry.organisationID,
            weight: entry.weight
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: container
        });
        
        infoWindow.open(map, marker);
      });
    });
  }

  function initMap() {
    map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 50, lng: 10 },
      zoom: 4,
      mapTypeId: 'roadmap',
      mapTypeControl: false
    });

    loadHeatmapData();
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
    width: 100vw;
    height: 100vh;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>

<div id="map"></div>
