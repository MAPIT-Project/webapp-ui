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
		triggerEdit?: boolean;
	}

	let {
		value,
		onSave,
		placeholder = 'Enter title...',
		maxLength = 30,
		class: containerClass = '',
		titleClass = 'text-xl font-semibold text-gray-100',
		inputClass = 'text-xl font-semibold bg-transparent border-b-2 border-blue-500 text-gray-100 outline-none',
		showEditIcon = true,
		compactMode = false,
		triggerEdit = false
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

	export function startEdit() { startEditing(); }

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

<div class="block {containerClass}">
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
				{placeholder}
				class="{inputClass} {isSaving ? 'cursor-not-allowed opacity-50' : ''} {isOverLimit
					? 'border-red-500'
					: isNearLimit
						? 'border-yellow-500'
						: ''}"
			/>

			<!-- Character counter and warning - positioned as block element below -->
			{#if showCharacterWarning || isNearLimit || isOverLimit}
				<div
					class="mt-1 text-center text-xs {isOverLimit
						? 'text-red-400'
						: isNearLimit
							? 'text-yellow-400'
							: 'text-gray-400'}"
				>
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
		<div
			class="group relative {compactMode
				? 'flex w-full items-center justify-between'
				: 'inline-flex items-center'}"
		>
			<h1 class="{titleClass} {compactMode ? 'min-w-0 flex-1 cursor-pointer' : ''}" title={value || placeholder} onclick={(e) => { e.preventDefault(); e.stopPropagation(); startEditing(e); }}>
				<span class="group-hover:hidden">{value || placeholder}</span>
				<span class="group-hover:block hidden">{(value || placeholder).length > 25 ? (value || placeholder).slice(0, 25) + '...' : (value || placeholder)}</span>
			</h1>
		</div>
	{/if}
</div>
