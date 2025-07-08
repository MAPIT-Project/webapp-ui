<script lang="ts">
    interface Props {
        message?: string;
    }

    let { message = "Loading conversation..." }: Props = $props();
</script>

<div class="flex items-center justify-center h-full">
    <div class="flex flex-col items-center gap-4">
        <div class="relative">
            <div class="w-12 h-12 rounded-full border-4 border-gray-700"></div>
            <div class="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-gray-400 text-sm">{message}</p>
    </div>
</div> 