<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";

    interface Props {
        userInput: string;
        isStreaming: boolean;
        isSending: boolean;
        streamingProgress: string;
        onInputChange: (value: string) => void;
        onSubmit: () => void;
        onStopStreaming: () => void;
    }

    let {
        userInput,
        isStreaming,
        isSending,
        streamingProgress,
        onInputChange,
        onSubmit,
        onStopStreaming
    }: Props = $props();

    // Check if input contains @mapit for styling
    function hasMapitInput(text: string): boolean {
        return /@mapit\b/i.test(text);
    }

    function handleSubmit() {
        onSubmit();
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        onInputChange(target.value);
    }
</script>

<div class="flex-shrink-0 p-4">
    <form on:submit|preventDefault={handleSubmit} class="relative max-w-4xl mx-auto">
        <div class="relative bg-[#2A2A2A]/50 rounded-2xl border border-gray-500/30 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all backdrop-blur-sm">
            <input
                type="text"
                value={userInput}
                on:input={handleInput}
                placeholder={isStreaming ? "AI is generating response..." : "Message AI Assistant..."}
                class="w-full px-4 py-3 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400 pr-12 rounded-2xl {hasMapitInput(userInput) ? 'text-emerald-500 font-semibold [text-shadow:0_0_8px_rgba(16,185,129,0.4)]' : ''}"
                disabled={isSending || isStreaming}
            />
            
            {#if isStreaming}
                <button
                    type="button"
                    on:click={onStopStreaming}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <Icon name="stop" className="text-current" />
                </button>
            {:else}
                <button
                    type="submit"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1.5 rounded-xl transition-all duration-200 border {userInput.trim() && !isSending ? 'border-emerald-500/50 text-emerald-400 hover:border-emerald-400 hover:text-emerald-300' : 'border-[#404040]/50 text-[#888888]'}"
                    disabled={isSending || !userInput.trim()}
                >
                    <Icon name="send" className="text-current" />
                </button>
            {/if}
        </div>
        
        <!-- Streaming progress indicator -->
        {#if isStreaming && streamingProgress}
            <div class="mt-4 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
                <div class="flex items-center gap-3">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                        <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.1s]"></div>
                        <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                    <span class="text-emerald-300 font-medium text-sm">{streamingProgress}</span>
                </div>
                <div class="mt-2 w-full bg-gray-700/50 rounded-full h-1 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-pulse"></div>
                </div>
            </div>
        {/if}

        <!-- Input hint -->
        <div class="text-center mt-2">
            <p class="text-xs text-gray-500">
                {#if isStreaming}
                    Real-time AI response streaming • Click stop to cancel
                {:else}
                    Press Enter to send • AI can make mistakes, verify important information
                {/if}
            </p>
        </div>
    </form>
</div> 