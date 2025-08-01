<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';

	interface Props {
		error: string;
	}

	let { error }: Props = $props();
</script>

<div class="mx-auto my-4 max-w-2xl">
	<div class="rounded-xl border border-red-800 bg-red-900/20 p-4 text-red-300 shadow-sm">
		<div class="flex items-center gap-3">
			<div class="flex-shrink-0">
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-red-800">
					<Icon name="error" className="text-red-400 text-sm" />
				</div>
			</div>
			<p class="whitespace-pre-wrap text-sm">{error}</p>
		</div>
	</div>
</div>
