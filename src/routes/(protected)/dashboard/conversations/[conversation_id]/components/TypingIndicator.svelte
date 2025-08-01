<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
</script>

<div class="group relative">
	<div class="flex items-start gap-4">
		<div class="flex-shrink-0">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg"
			>
				<Icon name="smart_toy" className="text-white text-sm" />
			</div>
		</div>

		<!-- Enhanced typing indicator with timing info -->
		<div
			class="max-w-md rounded-2xl rounded-tl-md border border-gray-600 bg-[#3A3A3C] px-4 py-4 shadow-lg"
		>
			<div class="space-y-3">
				<!-- Animated dots -->
				<div class="flex items-center gap-2">
					<div class="flex space-x-1">
						<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]"
						></div>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"
						></div>
					</div>
					<span class="ml-2 text-xs text-gray-400">AI is analyzing your query...</span>
				</div>

				<!-- Timing information -->
				<div
					class="rounded-lg border border-gray-600/50 bg-gray-700/50 px-3 py-2 text-xs text-gray-500"
				>
					<div class="mb-1 flex items-center gap-2">
						<Icon name="schedule" className="text-xs text-blue-400" />
						<span class="font-medium text-gray-400">Response Time</span>
					</div>
					<div class="ml-5 space-y-1">
						<div class="text-gray-400">
							• Average: <span class="text-blue-300">40 seconds</span>
						</div>
						<div class="text-gray-500">• Complex queries may take longer</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
