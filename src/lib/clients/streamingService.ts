export interface StreamingOptions {
	maxResults?: number;
	aiProvider?: 'openai' | 'gemini';
	aiVersion?: string;
	useLocalDb?: boolean;
	onMetadata?: (data: MetadataEvent) => void;
	onProgress?: (data: ProgressEvent) => void;
	onToken?: (token: string, fullAnswer: string) => void;
	onComplete?: (data: CompleteEvent) => void;
	onError?: (error: ErrorEvent) => void;
}

export interface MetadataEvent {
	type: 'metadata';
	ai_provider: string;
	ai_version: string;
	status: string;
}

export interface ProgressEvent {
	type: 'progress';
	phase: string;
	message: string;
}

export interface TokenEvent {
	type: 'token';
	content: string;
}

export interface CompleteEvent {
	type: 'complete';
	answer: string;
	logs: any;
	data_source: string;
	projects_found: number;
	processing_time: number;
	ai_provider: string;
	ai_version: string;
}

export interface ErrorEvent {
	type: 'error';
	error: string;
	details?: string;
}

export interface StreamingResult {
	metadata: MetadataEvent | null;
	progress: ProgressEvent[];
	tokens: string[];
	fullAnswer: string;
	logs: any;
	error: ErrorEvent | null;
	completed: boolean;
	completeData: CompleteEvent | null;
}

export class StreamingQueryService {
	private eventSource: EventSource | null = null;
	private isStreaming = false;

	constructor() {
		this.eventSource = null;
		this.isStreaming = false;
	}

	async streamQuery(question: string, options: StreamingOptions = {}): Promise<StreamingResult> {
		return new Promise((resolve, reject) => {
			if (this.isStreaming) {
				reject(new Error('Already streaming a query'));
				return;
			}

			// Prepare the request parameters for GET (SSE)
			const queryParams = new URLSearchParams({
				question,
				max_results: (options.maxResults || 5).toString(),
				ai_provider: options.aiProvider || 'gemini',
				ai_version: options.aiVersion || 'V6'
			});

			if (options.useLocalDb !== undefined) {
				queryParams.append('use_local_db', options.useLocalDb.toString());
			}

			// Create EventSource for SSE
			const url = `/api/query/stream?${queryParams}`;
			this.eventSource = new EventSource(url);
			this.isStreaming = true;

			const result: StreamingResult = {
				metadata: null,
				progress: [],
				tokens: [],
				fullAnswer: '',
				logs: null,
				error: null,
				completed: false,
				completeData: null
			};

			this.eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					switch (data.type) {
						case 'metadata':
							result.metadata = data;
							options.onMetadata?.(data);
							break;

						case 'progress':
							result.progress.push(data);
							options.onProgress?.(data);
							break;

						case 'token':
							result.tokens.push(data.content);
							result.fullAnswer += data.content;
							options.onToken?.(data.content, result.fullAnswer);
							break;

						case 'complete':
							result.completed = true;
							result.logs = data.logs;
							result.completeData = data;
							// Ensure we have the full answer from the complete event if needed
							if (data.answer && data.answer !== result.fullAnswer) {
								result.fullAnswer = data.answer;
							}
							options.onComplete?.(data);
							this.cleanup();
							resolve(result);
							break;

						case 'error':
							result.error = data;
							options.onError?.(data);
							this.cleanup();
							reject(new Error(data.details || data.error));
							break;
					}
				} catch (e) {
					console.error('Error parsing SSE data:', e);
					const errorEvent: ErrorEvent = {
						type: 'error',
						error: 'Failed to parse streaming data',
						details: e instanceof Error ? e.message : String(e)
					};
					result.error = errorEvent;
					options.onError?.(errorEvent);
					this.cleanup();
					reject(new Error('Failed to parse streaming data'));
				}
			};

			this.eventSource.onerror = (event) => {
				console.error('EventSource error:', event);
				const errorEvent: ErrorEvent = {
					type: 'error',
					error: 'Connection error during streaming',
					details: 'EventSource connection failed'
				};
				result.error = errorEvent;
				options.onError?.(errorEvent);
				this.cleanup();
				reject(new Error('Connection error during streaming'));
			};

			this.eventSource.onopen = () => {
				console.log('SSE connection opened');
			};
		});
	}

	stopStreaming(): void {
		console.log('Stopping streaming...');
		this.cleanup();
	}

	isCurrentlyStreaming(): boolean {
		return this.isStreaming;
	}

	private cleanup(): void {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		this.isStreaming = false;
	}

	// Cleanup method to be called when component is destroyed
	destroy(): void {
		this.cleanup();
	}
}
