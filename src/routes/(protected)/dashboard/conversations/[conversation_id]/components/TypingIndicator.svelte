<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
</script>

<div class="group relative">
    <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Icon name="smart_toy" className="text-white text-sm" />
            </div>
        </div>
        
        <!-- Enhanced typing indicator with timing info -->
        <div class="bg-[#3A3A3C] px-4 py-4 rounded-2xl rounded-tl-md shadow-lg border border-gray-600 max-w-md">
            <div class="space-y-3">
                <!-- Animated dots -->
                <div class="flex items-center gap-2">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]"></div>
                        <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                    <span class="text-xs text-gray-400 ml-2">AI is analyzing your query...</span>
                </div>
                
                <!-- Timing information -->
                <div class="text-xs text-gray-500 bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600/50">
                    <div class="flex items-center gap-2 mb-1">
                        <Icon name="schedule" className="text-xs text-blue-400" />
                        <span class="text-gray-400 font-medium">Response Time</span>
                    </div>
                    <div class="space-y-1 ml-5">
                        <div class="text-gray-400">• Average: <span class="text-blue-300">40 seconds</span></div>
                        <div class="text-gray-500">• Complex queries may take longer</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 