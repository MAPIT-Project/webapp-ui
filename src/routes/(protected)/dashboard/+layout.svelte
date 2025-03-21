<script lang="ts">
	import Sidebar from "./components/sidebar.svelte";
	import { sidebarExpanded } from '$lib/stores/sidebarStore';
	let { children } = $props();

	let sidebarWidth: number = $state(250);

	function updateWidth(width: number) {
		sidebarWidth = width;
	}
</script>


<div id="teleport-container"></div>

<Sidebar onUpdateWidth={updateWidth} />
<div style="margin-left: {sidebarWidth}px" class="transition-[margin] duration-150 ease-in-out bg-[#2B2A2C]">
	{@render children()}
</div>

