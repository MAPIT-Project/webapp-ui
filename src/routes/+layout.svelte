<script lang="ts">
	import '../app.css';
	import Sidebar from "./components/sidebar.svelte";
	import { sidebarExpanded } from '$lib/stores/sidebarStore';
	let { children } = $props();
</script>


<div id="teleport-container"></div>

<Sidebar />
<div class="ml-[250px] transition-[margin] duration-200 ease-in-out bg-[#2B2A2C]{$sidebarExpanded ? 'ml-[250px]' : ''}">
	{@render children()}
</div>

