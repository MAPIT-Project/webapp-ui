<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import type { Message } from "$lib/types/schema";
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';

    interface Props {
        message: Message;
        isGrouped: boolean;
        isLastInGroup: boolean;
    }

    let { message, isGrouped, isLastInGroup }: Props = $props();



    // Helper functions
    function formatMessageTime(date: Date | string): string {
        if (!date) return '';
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '';
            }
            
            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error('Error formatting message time:', error);
            return '';
        }
    }

    // Function to check if a message is an error
    function isErrorMessage(text: string): boolean {
        return text.startsWith('Error:');
    }

    // Function to safely render markdown
    function renderMarkdown(text: string): string {
        try {
            // Configure marked options for better formatting
            marked.setOptions({
                gfm: true,
                breaks: true // Convert \n to <br>
            });
            
            // Parse markdown and sanitize HTML
            const parsed = marked.parse(text) as string;
            let sanitized = DOMPurify.sanitize(parsed) as string;
            
            // Post-process to add target="_blank" to all links
            sanitized = sanitized.replace(
                /<a\s+href="([^"]*)"([^>]*)>/g, 
                '<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
            );
            
            return sanitized;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return text;
        }
    }
    
    // Function to highlight @mapit in messages
    function highlightMapitInMessage(text: string): string {
        // Replace @mapit (case insensitive) with highlighted version
        return text.replace(/@mapit\b/gi, '<span class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-1 py-0.5 rounded font-semibold text-sm shadow-sm border border-emerald-400/30">@mapit</span>');
    }
</script>

<div class="group relative {isGrouped ? 'mt-0.5' : 'mt-8 pt-4'} animate-[fadeInUp_0.3s_ease-out]">
    <div class="flex items-start gap-4 {message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}">
        <!-- Avatar - only show for first message in group -->
        <div class="flex-shrink-0 {isGrouped ? 'invisible' : ''}">
            {#if message.sender === 'user'}
                <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shadow-lg">
                    <Icon name="person" className="text-white text-sm" />
                </div>
            {:else}
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Icon name="smart_toy" className="text-white text-sm" />
                </div>
            {/if}
        </div>
        
        <!-- Message bubble -->
        <div class="flex-1 max-w-[80%] {message.sender === 'user' ? 'text-right' : 'text-left'}">
            <div class="inline-block">
                {#if message.sender === 'user'}
                    <div class="bg-gray-600 text-white px-3 py-2 rounded-lg {isGrouped ? 'rounded-tr-lg' : 'rounded-tr-sm'} shadow-sm">
                        <div class="prose prose-sm max-w-none">
                            <p class="whitespace-pre-wrap leading-relaxed m-0 text-sm">
                                {@html highlightMapitInMessage(message.text)}
                            </p>
                        </div>
                        {#if isLastInGroup}
                            <div class="text-xs text-gray-300/60 mt-1 text-right leading-none">
                                {formatMessageTime(message.createdAt)}
                            </div>
                        {/if}
                    </div>
                {:else}
                    {#if isErrorMessage(message.text)}
                        <!-- Error message styling -->
                        <div class="bg-red-900/20 border border-red-800 text-red-300 px-3 py-2 rounded-lg {isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm'} shadow-sm">
                            <div class="flex items-start gap-3">
                                <div class="flex-shrink-0 pt-1">
                                    <Icon name="error" className="text-red-400 text-sm" />
                                </div>
                                <div class="flex-1">
                                    <div class="prose prose-sm max-w-none">
                                        <p class="whitespace-pre-wrap leading-relaxed m-0 text-red-300 text-sm">{message.text}</p>
                                    </div>
                                </div>
                            </div>
                            {#if isLastInGroup}
                                <div class="text-xs text-red-400/60 mt-1 text-right leading-none">
                                    {formatMessageTime(message.createdAt)}
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <!-- Normal AI response -->
                        <div class="relative group/ai">
                            <div class="bg-[#3A3A3C] text-gray-100 px-3 py-2 rounded-lg {isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm'} shadow-sm border border-gray-600/50">
                                <div class="prose prose-sm prose-invert max-w-none [&>*]:text-gray-100 [&_p]:text-gray-100 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_h1]:text-blue-400 [&_h2]:text-emerald-400 [&_h3]:text-white [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2 [&_h1]:mt-4 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_ul]:my-3 [&_ol]:my-3 [&_li]:text-gray-200 [&_li]:my-1 [&_ul_li::marker]:text-blue-400 [&_ol_li::marker]:text-emerald-400 [&_strong]:text-white [&_em]:text-blue-300 [&_a]:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-300 [&_code]:bg-indigo-500/15 [&_code]:text-indigo-200 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:border [&_code]:border-indigo-500/20 [&_code]:text-sm [&_code]:font-medium [&_pre]:bg-slate-900/80 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:border [&_pre]:border-indigo-500/20 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0 [&_pre_code]:text-slate-200 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_blockquote]:bg-blue-400/5 [&_blockquote]:p-4 [&_blockquote]:rounded [&_table]:w-full [&_table]:my-4 [&_table]:bg-slate-800/50 [&_table]:rounded [&_table]:overflow-hidden [&_th]:bg-slate-700/80 [&_th]:text-white [&_th]:font-bold [&_th]:p-3 [&_th]:text-left [&_th]:border-b-2 [&_th]:border-indigo-500/30 [&_td]:p-3 [&_td]:border-b [&_td]:border-slate-600/20 [&_td]:text-gray-200 [&_tr:nth-child(even)]:bg-slate-700/30 [&_ul_ul]:mt-2 [&_ul_ul]:mb-2 [&_ul_ul]:bg-slate-900/40 [&_ul_ul]:p-2 [&_ul_ul]:rounded [&_ul_ul]:border [&_ul_ul]:border-slate-600/10 [&_ul_ul_li]:my-1 [&_ul_ul_li]:text-sm">
                                    {@html renderMarkdown(message.text)}
                                </div>
                                {#if isLastInGroup}
                                    <div class="text-xs text-gray-400/60 mt-1 text-right leading-none">
                                        {formatMessageTime(message.createdAt)}
                                    </div>
                                {/if}
                            </div>
                            
                            <!-- AI Metadata on hover - only show if at least one field has data -->
                            {#if message.sender === 'ai'}
                                <!-- Check both camelCase and snake_case field names -->
                                {@const aiProvider = message.aiProvider || (message as any).ai_provider}
                                {@const modelUsed = message.modelUsed || (message as any).model_used}
                                {@const aiVersion = message.aiVersion || (message as any).ai_version}
                                {@const dataSource = message.dataSource || (message as any).data_source}
                                {@const processingTime = message.processingTime || (message as any).processing_time}
                                {@const projectsFound = message.projectsFound !== undefined ? message.projectsFound : (message as any).projects_found}
                                {@const hasMetadata = aiProvider || modelUsed || dataSource || processingTime || (projectsFound !== null && projectsFound !== undefined)}
                                
                                {#if hasMetadata}
                                
                                <div class="absolute bottom-full left-0 mb-2 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    <div class="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-xl min-w-64">
                                        <div class="text-xs space-y-2">
                                            <div class="text-gray-300 font-medium border-b border-gray-600 pb-1 mb-2">AI Response Details</div>
                                            
                                            {#if aiProvider && modelUsed}
                                                <div class="flex items-center gap-2">
                                                    <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span class="text-gray-200">{aiProvider} ({modelUsed})</span>
                                                    {#if aiVersion}
                                                        <span class="text-blue-400">• {aiVersion}</span>
                                                    {/if}
                                                </div>
                                            {/if}
                                            
                                            {#if dataSource}
                                                <div class="flex items-center gap-2">
                                                    <Icon name="storage" className="text-xs text-blue-400" />
                                                    <span class="text-gray-200">Data: {dataSource}</span>
                                                </div>
                                            {/if}
                                            
                                            {#if processingTime}
                                                <div class="flex items-center gap-2">
                                                    <Icon name="schedule" className="text-xs text-purple-400" />
                                                    <span class="text-gray-200">Time: {Number(processingTime).toFixed(2)}s</span>
                                                </div>
                                            {/if}
                                            
                                            {#if projectsFound !== null && projectsFound !== undefined}
                                                <div class="flex items-center gap-2">
                                                    <Icon name="folder" className="text-xs text-emerald-400" />
                                                    <span class="text-gray-200">Projects: {projectsFound}</span>
                                                </div>
                                            {/if}
                                            
                                        </div>
                                    </div>
                                </div>
                                {/if}
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div> 