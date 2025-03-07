<script lang="ts">
  import Icon from './icon.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { modalBackdropClick } from '$lib/utils/teleport';
  import { writable } from 'svelte/store';
  import { fade, scale, fly } from 'svelte/transition';
  import { cubicIn, quartInOut } from 'svelte/easing';
	import MainButton from './main-button.svelte';

  export let isOpen: boolean;
  export let title: string;
  export let subtitle: string | null = null;
  export let fullWidth = false;
  export let large = false;
  export let small = false;
  export let borderBottomHeaderNone = true;
  export let includeHeader = true;
  export let includeFooter = true;
  export let rounded = true;
  export let background: string = "bg-white"
  export let disableOverFlowYAuto = false;

  export let footer: Partial<{
    show: boolean;
  }> = {};
  export let alignItems: 'start' | 'end' | 'baseline' | 'stretch' | 'center' = 'center';

  const dispatch = createEventDispatcher<{ save: object; cancel: void; open: void }>();

  let data = writable<object>({});
  let show = writable(false);

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
  };

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


{#if isOpen}
<div class="absolute">
  <div class="relative z-[100]" aria-labelledby={title} role="dialog" aria-modal="true">
    <div
      id="modal-backdrop"
      class="fixed top-0 left-0 h-full w-full bg-black/50 overflow-hidden z-40"
      transition:fade={{ duration: 300 }}
    />

    <div class="fixed inset-0 z-[100] h-[100dvh]">
      <!--  overflow-y-auto   -->
      <div
        id="model-outside"
        class="flex min-h-full items-{alignItems} item justify-center text-center"
      >
          <div
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
              : ''} max-h-dvh max-h-[calc(100vh - 24px)] z-[99999] flex justify-between flex-col md:rounded-b-xl shadow-pop-up relative transform overflow-hidden {background} text-left transition-all"
          >
          
            <!-- Header -->

            {#if includeHeader}
            <header
              class="flex px-6 items-center flex-col gap-1 items-center justify-center shrink-0 relative rounded-t-xl w-full border-b-[1px] border-gray-400/60"
            >
              <button
                class="absolute right-2 top-2 flex items-center justify-center h-9 w-9 rounded-full hover:bg-grey transition duration-300 ease-in-out"
                on:click={() => close()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              

              </button>

              <span class="text-xl p-3 font-semibold">{title}</span>
              {#if subtitle}
                <p class="text-sm text-center font-pnregular text-grey-darker-7">{subtitle}</p>
              {/if}
            </header>
            {/if}

            <!-- Content -->
            <div class="{disableOverFlowYAuto ? 'overflow-y-auto overflow-x-hidden' : ''} flex-1 m-8 p-1">
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