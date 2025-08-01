<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
</script>

<div class="flex h-full items-center justify-center">
	<div class="max-w-md p-8 text-center">
		<div
			class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg"
		>
			<Icon name="chat" className="text-white text-xl" />
		</div>
		<h3 class="mb-3 text-xl font-semibold text-gray-200">Start a conversation</h3>
		<p class="leading-relaxed text-gray-400">
			I'm here to help answer your questions and assist with your tasks. What would you like to
			know?
		</p>
	</div>
</div>
