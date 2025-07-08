<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import EditableTitle from "$lib/components/generic/editable-title.svelte";
    import type { Conversation } from "$lib/types/schema";

    interface Props {
        conversation: Conversation | null;
        isLoading: boolean;
        conversationName: string;
        onSave: (newName: string) => Promise<boolean>;
    }

    let {
        conversation,
        isLoading,
        conversationName,
        onSave
    }: Props = $props();
</script>

<div class="flex-shrink-0 p-3 text-center">
    {#if conversation}
        <div class="space-y-2">
            <EditableTitle 
                value={conversationName}
                onSave={onSave}
                placeholder="Untitled Conversation"
                maxLength={30}
                showEditIcon={true}
                titleClass="text-xl font-semibold text-gray-100"
                inputClass="text-xl font-semibold bg-transparent border-b-2 border-blue-500 text-gray-100 outline-none text-center"
            />
        </div>
    {:else if !isLoading}
        <div class="space-y-2">
            <h1 class="text-xl font-semibold text-gray-100">New Conversation</h1>
            <p class="text-xs text-gray-400">How can I help you today?</p>
        </div>
    {/if}
</div> 