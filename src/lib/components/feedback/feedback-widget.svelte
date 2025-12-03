<script lang="ts">
  import Icon from '$lib/components/generic/icon.svelte';
  import { feedbackService } from '$lib/clients/feedbackService';
  import type { FeedbackSubmission } from '$lib/types/feedback';
  import { fade, slide } from 'svelte/transition';

  export let conversationId: string | number;
  export let messageId: string | number;
  export let toolsUsed: string[] = [];
  export let responseTimeMs: number | undefined = undefined;
  export let className: string = '';

  let submitted = false;
  let showDetailed = false;
  let rating: 1 | 2 | 3 | 4 | 5 = 5;
  let feedbackType: FeedbackSubmission['feedback_type'] = 'helpful';
  let feedbackText = '';
  let isSubmitting = false;

  async function handleQuickFeedback(isHelpful: boolean) {
    if (isHelpful) {
      await submit({
        rating: 5,
        feedback_type: 'helpful'
      });
    } else {
      showDetailed = true;
      rating = 2; // Default low rating for thumbs down
      feedbackType = 'not_helpful';
    }
  }

  async function submit(data: Partial<FeedbackSubmission>) {
    isSubmitting = true;
    try {
      await feedbackService.submitFeedback({
        conversation_id: conversationId.toString(),
        message_id: messageId.toString(),
        tools_used: toolsUsed,
        response_time_ms: responseTimeMs,
        rating,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
        ...data
      } as FeedbackSubmission);
      submitted = true;
      showDetailed = false;
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex flex-col items-start gap-2 {className}">
  {#if !submitted && !showDetailed}
    <div class="flex items-center gap-2" transition:fade>
      <button
        class="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-green-400 transition-colors"
        on:click={() => handleQuickFeedback(true)}
        aria-label="Helpful"
        title="Helpful"
      >
        <Icon name="thumb_up" className="text-xs" />
      </button>
      <button
        class="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
        on:click={() => handleQuickFeedback(false)}
        aria-label="Not Helpful"
        title="Not Helpful"
      >
        <Icon name="thumb_down" className="text-xs" />
      </button>
    </div>
  {/if}

  {#if showDetailed}
    <div class="w-full max-w-sm bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 mt-2" transition:slide>
      <div class="flex justify-between items-center mb-3">
        <span class="text-sm font-medium text-gray-200">Provide Feedback</span>
        <button class="text-gray-500 hover:text-gray-300" on:click={() => showDetailed = false}>
          <Icon name="close" className="text-sm" />
        </button>
      </div>

      <!-- Rating -->
      <div class="flex gap-1 mb-3">
        {#each [1, 2, 3, 4, 5] as star}
          <button
            class="text-lg transition-colors {star <= rating ? 'text-yellow-400' : 'text-gray-600'}"
            on:click={() => rating = star as 1|2|3|4|5}
          >
            ★
          </button>
        {/each}
      </div>

      <!-- Type -->
      <div class="mb-3">
        <select
          bind:value={feedbackType}
          class="w-full bg-[#2C2C2C] text-gray-200 text-xs rounded border border-gray-600 p-2 focus:border-blue-500 outline-none"
        >
          <option value="helpful">Helpful</option>
          <option value="not_helpful">Not Helpful</option>
          <option value="incorrect">Incorrect Information</option>
          <option value="incomplete">Incomplete Answer</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Text -->
      <textarea
        bind:value={feedbackText}
        placeholder="Tell us more..."
        class="w-full h-20 bg-[#2C2C2C] text-gray-200 text-xs rounded border border-gray-600 p-2 mb-3 focus:border-blue-500 outline-none resize-none"
      ></textarea>

      <button
        class="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 rounded transition-colors disabled:opacity-50"
        on:click={() => submit({})}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  {/if}

  {#if submitted}
    <div class="text-xs text-gray-500 flex items-center gap-1" transition:fade>
      <Icon name="check_circle" className="text-green-500 text-xs" />
      <span>Thanks for your feedback!</span>
    </div>
  {/if}
</div>
