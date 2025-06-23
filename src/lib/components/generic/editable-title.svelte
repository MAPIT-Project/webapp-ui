<script lang="ts">
    interface Props {
        value: string;
        onSave: (newValue: string) => Promise<boolean>;
        placeholder?: string;
        maxLength?: number;
        class?: string;
        titleClass?: string;
        inputClass?: string;
        showEditIcon?: boolean;
        compactMode?: boolean;
    }
    
    let { 
        value, 
        onSave, 
        placeholder = "Enter title...", 
        maxLength = 30,
        class: containerClass = "",
        titleClass = "text-xl font-semibold text-gray-100",
        inputClass = "text-xl font-semibold bg-transparent border-b-2 border-blue-500 text-gray-100 outline-none",
        showEditIcon = true,
        compactMode = false
    }: Props = $props();
    
    let isEditing = $state(false);
    let editValue = $state(value);
    let inputElement: HTMLInputElement;
    let isSaving = $state(false);
    let showCharacterWarning = $state(false);
    
    // Derived state for character count and warnings
    let remainingChars = $derived(maxLength - editValue.length);
    let isNearLimit = $derived(remainingChars <= 5 && remainingChars >= 0);
    let isOverLimit = $derived(remainingChars < 0);
    
    // Update editValue when value prop changes
    $effect(() => {
        if (!isEditing) {
            editValue = value;
        }
    });
    
    // Focus input when editing starts
    $effect(() => {
        if (isEditing && inputElement) {
            inputElement.focus();
            inputElement.select();
        }
    });
    
    function startEditing(event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        editValue = value;
        isEditing = true;
        showCharacterWarning = false;
    }
    
    function cancelEditing() {
        editValue = value;
        isEditing = false;
    }
    
    async function saveEdit() {
        const trimmedValue = editValue.trim();
        
        if (!trimmedValue || trimmedValue === value) {
            cancelEditing();
            return;
        }
        
        isSaving = true;
        
        try {
            const success = await onSave(trimmedValue);
            
            if (success) {
                value = trimmedValue;
                isEditing = false;
            } else {
                // Reset to original value on failure
                editValue = value;
            }
        } catch (error) {
            console.error('Error saving title:', error);
            editValue = value;
        } finally {
            isSaving = false;
        }
    }
    
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!isOverLimit) {
                saveEdit();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditing();
        }
    }
    
    function handleInput() {
        // Show warning when user types and approaches/exceeds limit
        if (isNearLimit || isOverLimit) {
            showCharacterWarning = true;
        } else {
            showCharacterWarning = false;
        }
    }
    
    function handleBlur() {
        // Only save if not currently saving and not over limit
        if (!isSaving && !isOverLimit) {
            saveEdit();
        }
    }
</script>

<div class="inline-block {containerClass}">
    {#if isEditing}
        <div class="w-full">
            <input
                bind:this={inputElement}
                bind:value={editValue}
                onkeydown={handleKeydown}
                onblur={handleBlur}
                oninput={handleInput}
                disabled={isSaving || isOverLimit}
                maxlength={maxLength}
                placeholder={placeholder}
                class="{inputClass} {isSaving ? 'opacity-50 cursor-not-allowed' : ''} {isOverLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}"
            />
            
            <!-- Character counter and warning - positioned as block element below -->
            {#if showCharacterWarning || isNearLimit || isOverLimit}
                <div class="mt-1 text-xs text-center {isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-400'}">
                    {#if isOverLimit}
                        You can only use {maxLength} characters
                    {:else if isNearLimit}
                        {remainingChars} characters remaining
                    {:else}
                        {editValue.length}/{maxLength} characters
                    {/if}
                </div>
            {/if}
        </div>
    {:else}
        <div class="group relative {compactMode ? 'flex items-center justify-between w-full' : 'inline-flex items-center gap-2'}">
            <h1 
                class="{titleClass} {compactMode ? 'flex-1 min-w-0' : ''}"
                title="{value || placeholder}"
            >
                {value || placeholder}
            </h1>
            {#if showEditIcon}
                <button
                    onclick={(e) => startEditing(e)}
                    class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 {compactMode ? 'p-0.5' : 'p-1'} rounded hover:bg-gray-700/50 flex-shrink-0 relative z-10"
                    title="Edit title"
                >
                    <svg width="{compactMode ? '12' : '14'}" height="{compactMode ? '12' : '14'}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            {/if}
        </div>
    {/if}
</div> 