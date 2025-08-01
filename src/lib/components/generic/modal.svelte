<script lang="ts">
	import Icon from './icon.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { modalBackdropClick } from '$lib/utils/teleport';
	import { writable } from 'svelte/store';
	import { fade, scale, fly } from 'svelte/transition';
	import { cubicIn, quartInOut } from 'svelte/easing';
	import MainButton from '$lib/components/generic/main-button.svelte';

	export let isOpen: boolean;
	export let title: string;
	export let subtitle: string | null = null;
	export let fullWidth = false;
	export let large = false;
	export let small = false;
	export let includeHeader = true;
	export let includeFooter = true;
	export let rounded = true;
	export let background: string = 'bg-white';
	export let disableOverFlowYAuto = false;
	export let closeOnEscape = true;

	export let footer: Partial<{
		show: boolean;
	}> = {};
	export let alignItems: 'start' | 'end' | 'baseline' | 'stretch' | 'center' = 'center';

	const dispatch = createEventDispatcher<{ save: object; cancel: void; open: void }>();

	let data = writable<object>({});
	let show = writable(false);
	let modalElement: HTMLElement;
	let focusableElements: HTMLElement[] = [];
	let firstFocusableElement: HTMLElement;
	let lastFocusableElement: HTMLElement;

	/**
	 * Sets the `show` variable to `true`, which opens the modal.
	 * @function
	 * @returns {boolean}
	 */
	const open = (): void => {
		dispatch('open');
		show.set(true);
		document.body.style.paddingRight = `${window.innerWidth - document.body.clientWidth}px`;
		document.body.style.overflow = 'hidden';

		// Setup focus trap after rendering
		setTimeout(setupFocusTrap, 50);
	};

	/**
	 * Sets up focus trapping within the modal
	 */
	function setupFocusTrap() {
		if (!modalElement) return;

		focusableElements = Array.from(
			modalElement.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		) as HTMLElement[];

		firstFocusableElement = focusableElements[0];
		lastFocusableElement = focusableElements[focusableElements.length - 1];

		// Focus the first element
		firstFocusableElement?.focus();
	}

	/**
	 * Handle keydown events for modal
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;

		// Close on Escape key if enabled
		if (e.key === 'Escape' && closeOnEscape) {
			e.preventDefault();
			close();
			return;
		}

		// Implement focus trapping with Tab key
		if (e.key === 'Tab' && focusableElements.length > 0) {
			// If shift + tab and on first element, go to last
			if (e.shiftKey && document.activeElement === firstFocusableElement) {
				e.preventDefault();
				lastFocusableElement?.focus();
			}
			// If tab and on last element, go to first
			else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
				e.preventDefault();
				firstFocusableElement?.focus();
			}
		}
	}

	/**
	 * Sets the `show` variable to `false`, which closes the modal.
	 * @function
	 * @returns {void}
	 */
	const close = (): void => {
		isOpen = false;

		setTimeout(() => {
			document.body.style.paddingRight = '0';
			document.body.style.overflow = 'auto';
		}, 200);
	};

	/**
	 * Dispatches a 'save' event and closes the modal.
	 * @function
	 * @returns {void}
	 */
	const save = (): void => {
		dispatch('save', { ...$data });
		close();
	};

	/**
	 * Dispatches a 'cancel' event and closes the modal.
	 * @function
	 * @returns {void}
	 */
	const cancel = (): void => {
		dispatch('cancel');
		close();
	};

	onMount(() => {
		// Patch properties
		if (footer?.show === undefined) footer.show = true;
	});
	export { open };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="absolute">
		<div class="relative z-[100]" aria-labelledby={title} role="dialog" aria-modal="true">
			<div
				id="modal-backdrop"
				class="fixed left-0 top-0 z-40 h-full w-full overflow-hidden bg-black/50"
				transition:fade={{ duration: 300 }}
			></div>

			<div class="fixed inset-0 z-[100] h-[100dvh]">
				<!--  overflow-y-auto   -->
				<div
					id="model-outside"
					class="flex min-h-full items-{alignItems} item justify-center text-center"
				>
					<div
						bind:this={modalElement}
						transition:scale={{ duration: 250, start: 0.7, opacity: 0, easing: quartInOut }}
						use:modalBackdropClick
						on:clickedOutsideModal={() => close()}
						class="{fullWidth
							? 'w-[100dvw]'
							: small
								? 'md:w-[384px]'
								: large
									? 'md:w-[780px]'
									: 'md:w-[588px]'} {rounded
							? 'rounded-t-xl'
							: ''} max-h-[calc(100vh - 24px)] shadow-pop-up relative z-[99999] flex max-h-dvh transform flex-col justify-between overflow-hidden md:rounded-b-xl {background} text-left transition-all"
					>
						<!-- Header -->

						{#if includeHeader}
							<header
								class="relative flex w-full shrink-0 flex-col items-center items-center justify-center gap-1 rounded-t-xl border-b-[1px] border-gray-600/60 px-6"
							>
								<button
									class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition duration-300 ease-in-out hover:bg-[#2A2A2A]"
									on:click={() => close()}
									aria-label="Close modal"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="size-6"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
									</svg>
								</button>

								<span class="p-3 text-xl font-semibold text-gray-100">{title}</span>
								{#if subtitle}
									<p class="font-pnregular text-center text-sm text-gray-300">{subtitle}</p>
								{/if}
							</header>
						{/if}

						<!-- Content -->
						<div
							class="{disableOverFlowYAuto
								? 'overflow-y-auto overflow-x-hidden'
								: ''} m-8 flex-1 p-1"
						>
							<slot name="content" {data} {close} />
						</div>

						{#if includeFooter}
							<footer class="mx-8 mb-6 mt-6">
								<slot name="footer" {save} {cancel} />
							</footer>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
