<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";

    interface Props {
        error: string;
    }

    let { error }: Props = $props();
</script>

<div class="mx-auto max-w-2xl my-4">
    <div class="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl shadow-sm">
        <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
                <div class="w-6 h-6 rounded-full bg-red-800 flex items-center justify-center">
                    <Icon name="error" className="text-red-400 text-sm" />
                </div>
            </div>
            <p class="text-sm whitespace-pre-wrap">{error}</p>
        </div>
    </div>
</div> 