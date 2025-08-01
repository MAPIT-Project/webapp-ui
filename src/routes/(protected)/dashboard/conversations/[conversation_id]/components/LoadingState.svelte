<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading conversation...' }: Props = $props();
</script>

<div class="flex h-full items-center justify-center">
	<div class="flex flex-col items-center gap-4">
		<div class="relative">
			<div class="h-12 w-12 rounded-full border-4 border-gray-700"></div>
			<div
				class="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"
			></div>
		</div>
		<p class="text-sm text-gray-400">{message}</p>
	</div>
</div>
