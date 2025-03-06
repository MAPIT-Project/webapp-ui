<script lang="ts">
	import '../app.css';
	import Sidebar from "./components/sidebar.svelte";

	
	let { children } = $props();
</script>


<div id="teleport-container"></div>

<div class="min-h-screen h-full w-full bg-[#2B2A2C] overflow-x-auto">
	<Sidebar />
	{@render children()}
	
</div>

