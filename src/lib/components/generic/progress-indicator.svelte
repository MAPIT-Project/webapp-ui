<script lang="ts">
	import type { ProgressMessage } from '$lib/types/schema';
	import Icon from './icon.svelte';

	interface Props {
		progress: ProgressMessage;
	}

	let { progress }: Props = $props();

	// Calculate percentage
	const percentage = $derived((progress.step / progress.totalSteps) * 100);

	// Get progress bar color based on percentage
	const progressColor = $derived(() => {
		if (percentage < 33) return 'bg-gradient-to-r from-blue-500 to-blue-600';
		if (percentage < 66) return 'bg-gradient-to-r from-purple-500 to-purple-600';
		return 'bg-gradient-to-r from-green-500 to-green-600';
	});

	// Get status icon
	const statusIcon = $derived(() => {
		if (percentage < 33) return 'hourglass_empty';
		if (percentage < 66) return 'sync';
		return 'check_circle';
	});

	// Animation for the progress bar
	const progressAnimation = $derived(`animate-pulse-slow`);
</script>

<div class="progress-container animate-fadeInUp">
	<div class="progress-header">
		<div class="progress-icon">
			<Icon name={statusIcon} className="text-purple-400 text-lg animate-float" />
		</div>
		<div class="progress-text">
			<p class="progress-message">{progress.message}</p>
			<p class="progress-steps">Step {progress.step} of {progress.totalSteps}</p>
		</div>
	</div>

	<div class="progress-bar-container">
		<div class="progress-bar">
			<div
				class="progress-fill {progressColor} {progressAnimation}"
				style="width: {percentage}%"
			>
				<div class="progress-glow"></div>
			</div>
		</div>
		<div class="progress-percentage">
			{Math.round(percentage)}%
		</div>
	</div>
</div>

<style>
	.progress-container {
		@apply flex flex-col gap-3 p-4 rounded-lg border border-purple-500/20 bg-purple-950/30 backdrop-blur-sm;
		position: relative;
		overflow: hidden;
	}

	.progress-container::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), transparent);
		border-radius: 0.5rem;
		opacity: 0.5;
		animation: shimmer 3s ease-in-out infinite;
	}

	.progress-header {
		@apply flex items-start gap-3;
	}

	.progress-icon {
		@apply flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center;
	}

	.progress-text {
		@apply flex-1 min-w-0;
	}

	.progress-message {
		@apply text-purple-200 font-medium text-sm mb-1 leading-relaxed;
	}

	.progress-steps {
		@apply text-purple-400/70 text-xs;
	}

	.progress-bar-container {
		@apply flex items-center gap-3;
	}

	.progress-bar {
		@apply flex-1 h-2 bg-gray-800 rounded-full overflow-hidden relative;
	}

	.progress-fill {
		@apply h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden;
	}

	.progress-glow {
		@apply absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent;
		animation: shimmer 2s ease-in-out infinite;
	}

	.progress-percentage {
		@apply text-purple-300 font-semibold text-sm min-w-[3rem] text-right;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes pulseSlow {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.animate-fadeInUp {
		animation: fadeInUp 0.4s ease-out forwards;
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}

	.animate-pulse-slow {
		animation: pulseSlow 2s ease-in-out infinite;
	}
</style>