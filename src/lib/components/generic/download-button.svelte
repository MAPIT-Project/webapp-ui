<script lang="ts">
	import Icon from './icon.svelte';

	interface Props {
		url: string;
		fileType: 'docx' | 'xlsx' | 'zip';
		fileName?: string;
		fileSize?: string;
		packageContents?: string[];
		primary?: boolean;
	}

	let { url, fileType, fileName, fileSize, packageContents, primary = false }: Props = $props();

	let isDownloading = $state(false);
	let downloadError = $state<string | null>(null);

	// Get icon and color based on file type
	const fileConfig = $derived(() => {
		switch (fileType) {
			case 'docx':
				return {
					icon: 'description',
					label: 'Word Document',
					color: 'from-blue-500 to-blue-600',
					bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30'
				};
			case 'xlsx':
				return {
					icon: 'table_chart',
					label: 'Excel Spreadsheet',
					color: 'from-green-500 to-green-600',
					bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30'
				};
			case 'zip':
				return {
					icon: 'folder_zip',
					label: 'ZIP Package',
					color: 'from-purple-500 to-purple-600',
					bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30'
				};
			default:
				return {
					icon: 'download',
					label: 'Download',
					color: 'from-gray-500 to-gray-600',
					bgColor: 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/30'
				};
		}
	});

	// Generate default filename if not provided
	const defaultFileName = $derived(() => {
		if (fileName) return fileName;
		const timestamp = new Date().toISOString().slice(0, 10);
		switch (fileType) {
			case 'docx': return `proposal-part-b-${timestamp}.docx`;
			case 'xlsx': return `proposal-budget-${timestamp}.xlsx`;
			case 'zip': return `proposal-package-${timestamp}.zip`;
			default: return `download-${timestamp}.${fileType}`;
		}
	});

	async function handleDownload() {
		if (isDownloading) return;

		isDownloading = true;
		downloadError = null;

		try {
			// Use the proxy API for download
			const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}`;

			const response = await fetch(proxyUrl);

			if (!response.ok) {
				throw new Error(`Download failed: ${response.statusText}`);
			}

			// Get the content type from response
			const contentType = response.headers.get('content-type') || 'application/octet-stream';

			// Get the blob
			const blob = await response.blob();

			// Create download URL
			const downloadUrl = window.URL.createObjectURL(blob);

			// Create temporary link and trigger download
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = defaultFileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up the URL
			window.URL.revokeObjectURL(downloadUrl);

			// Show success feedback
			showSuccessFeedback();

		} catch (error) {
			console.error('Download error:', error);
			downloadError = error instanceof Error ? error.message : 'Download failed';
		} finally {
			isDownloading = false;
		}
	}

	function showSuccessFeedback() {
		// Could add a toast notification here
		console.log('Download completed successfully');
	}
</script>

<div class="download-container">
	<!-- Main download button -->
	<button
		class="download-button {primary ? `download-button-primary ${fileType}` : `download-button-secondary ${fileType}`}"
		onclick={handleDownload}
		disabled={isDownloading}
		class:opacity-50={isDownloading}
		class:cursor-not-allowed={isDownloading}
	>
		<div class="button-content">
			{#if isDownloading}
				<div class="loading-spinner">
					<Icon name="sync" className="animate-spin" />
				</div>
				<span class="button-text">Downloading...</span>
			{:else}
				<div class="button-icon">
					<Icon name={fileConfig.icon} />
				</div>
				<span class="button-text">
					{#if primary}
						Download {fileConfig.label}
					{:else}
						Download
					{/if}
				</span>
			{/if}
		</div>

		{#if primary && !isDownloading}
			<div class="button-badge">
				<Icon name="file_download" className="text-xs" />
			</div>
		{/if}
	</button>

	<!-- File details -->
	{#if primary && (fileSize || packageContents)}
		<div class="file-details">
			{#if fileSize}
				<p class="file-size">
					<Icon name="storage" className="text-xs mr-1" />
					{fileSize}
				</p>
			{/if}

			{#if packageContents && packageContents.length > 0}
				<div class="package-contents">
					<p class="contents-title">Package contents:</p>
					<ul class="contents-list">
						{#each packageContents as file}
							<li class="contents-item">
								<Icon name="insert_drive_file" className="text-xs mr-1" />
								{file}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Error message -->
	{#if downloadError}
		<div class="error-message">
			<Icon name="error" className="text-red-400 text-sm mr-1" />
			<span class="text-red-300 text-sm">{downloadError}</span>
		</div>
	{/if}
</div>

<style>
	.download-container {
		@apply flex flex-col gap-2;
	}

	.download-button {
		@apply relative flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all duration-300 font-medium text-sm;
		@apply focus:outline-none focus:ring-2 focus:ring-purple-500/50;
		@apply shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20;
		@apply backdrop-blur-sm;
	}

	.download-button-primary {
		@apply bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent;
		@apply hover:scale-[1.02] active:scale-[0.98];
	}

	.download-button-secondary {
		@apply bg-gray-500/10 hover:bg-gray-500/20 text-gray-200 border border-gray-500/30;
		@apply hover:scale-[1.02] hover:border-purple-500/50 active:scale-[0.98];
	}

	/* File type specific styles */
	.download-button-primary.docx {
		@apply bg-gradient-to-r from-blue-500 to-blue-600;
	}

	.download-button-primary.xlsx {
		@apply bg-gradient-to-r from-green-500 to-green-600;
	}

	.download-button-primary.zip {
		@apply bg-gradient-to-r from-purple-500 to-purple-600;
	}

	.download-button-secondary.docx {
		@apply bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30;
	}

	.download-button-secondary.xlsx {
		@apply bg-green-500/10 hover:bg-green-500/20 border-green-500/30;
	}

	.download-button-secondary.zip {
		@apply bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30;
	}

	.button-content {
		@apply flex items-center gap-2;
	}

	.button-icon {
		@apply flex-shrink-0;
	}

	.button-text {
		@apply flex-1 text-left;
	}

	.button-badge {
		@apply flex items-center justify-center w-6 h-6 rounded-full bg-white/20;
	}

	.loading-spinner {
		@apply flex-shrink-0;
	}

	.file-details {
		@apply space-y-1 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-xs;
	}

	.file-size, .contents-title {
		@apply text-gray-400 mb-1;
	}

	.contents-list {
		@apply space-y-1;
	}

	.contents-item {
		@apply flex items-center text-gray-300;
	}

	.error-message {
		@apply flex items-center p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs;
	}

	/* Animations */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>