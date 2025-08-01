<script lang="ts">
	import { useDemo } from '$lib/stores/apiModeStore';
	import Icon from '$lib/components/generic/icon.svelte';
</script>

<div class="flex items-center gap-1.5 px-2 py-1">
	<div class="flex items-center gap-1">
		<Icon
			name={$useDemo ? 'science' : 'database'}
			className="text-xs {$useDemo ? 'text-blue-400' : 'text-green-400'}"
		/>

		<label for="apiModeToggle" class="flex cursor-pointer select-none items-center gap-1.5">
			<div class="relative">
				<input type="checkbox" id="apiModeToggle" class="sr-only" bind:checked={$useDemo} />
				<div
					class="block h-3 w-6 rounded-full border border-white/20 transition-all duration-300 {$useDemo
						? 'bg-blue-500'
						: 'bg-green-500'}"
				></div>
				<div
					class="absolute left-0.5 top-0.5 h-2 w-2 rounded-full bg-white transition-all duration-300"
					class:translate-x-3={$useDemo}
				></div>
			</div>
			<span class="text-xs text-white/90">
				{$useDemo ? 'Demo' : 'Prod'}
			</span>
		</label>
	</div>

	<!-- Compact info icon -->
	<div class="group relative">
		<Icon
			name="info"
			className="h-3 w-3 text-white/50 hover:text-white/80 transition-colors cursor-help"
		/>
		<div
			class="tooltip pointer-events-none invisible absolute -right-2 z-[100] mt-2
                  w-44 rounded-lg border border-white/20 bg-gray-900/95 p-2 text-xs opacity-0 shadow-xl backdrop-blur-lg transition-all duration-300 group-hover:visible group-hover:opacity-100"
		>
			<div class="space-y-1">
				<p class="text-xs font-medium text-white">API Mode</p>
				<div class="space-y-0.5 text-[10px] leading-relaxed text-white/70">
					<p><span class="font-medium text-blue-400">Demo:</span> Simulated responses</p>
					<p><span class="font-medium text-green-400">Prod:</span> Live CORDIS data</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.group {
		position: relative;
	}
</style>
