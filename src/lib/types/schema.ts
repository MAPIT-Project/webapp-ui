// Import database types directly
import type {
	client,
	clientCollaboration,
	collaboration,
	message,
	conversation,
	organizations,
	projects
} from '$lib/server/db/schema';

// Re-export database types
export type Client = typeof client.$inferSelect;
export type ClientCollaboration = typeof clientCollaboration.$inferSelect;
export type Collaboration = typeof collaboration.$inferSelect;
export type Message = typeof message.$inferSelect;
export type Conversation = typeof conversation.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Project = typeof projects.$inferSelect;

// Additional types for the application
export interface AppContext {
	user: Client | null;
	organization: Organization | null;
	// Add other context properties as needed
}

// Types for API responses
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface MessageWithSuggestions {
	id: number;
	conversationId: number;
	text: string;
	sender: 'user' | 'ai' | 'system';
	createdAt: Date;
	updatedAt: Date;
	userId: number | null;
	aiProvider: string | null;
	aiVersion: string | null;
	modelUsed: string | null;
	dataSource: string | null;
	processingTime: string | null;
	projectsFound: number | null;
	context: string | null;
	logsQuestion: string | null;
	logsModelUsed: string | null;
	logsPhases: string | null;
	logsTotalProcessingTimeMs: number | null;
	logsProjectsRetrieved: number | null;
	logsProjectsProcessed: number | null;
	logsSuccess: boolean | null;
	logsAverageRelevanceScore: string | null;
	citations?: Citation[] | null;
	follow_up_suggestions?: string[] | null;
}

export interface Citation {
	id: string;
	title: string;
	snippet?: string;
	url?: string;
	metadata?: {
		source?: string;
		callId?: string;
		isStructured?: boolean;
		priority?: string;
		sourceType?: string;
		chunkId?: string;
		relevanceScore?: number;
		documentType?: string;
		authors?: string[];
		publicationDate?: string;
	};
	// Add other citation metadata fields as needed
}

export interface StreamingMessage {
	id: string;
	text: string;
	sender: 'user' | 'ai' | 'system';
	timestamp: string;
	isStreaming?: boolean;
	isComplete?: boolean;
	citations?: Citation[];
	downloadUrl?: string;
	fileType?: 'docx' | 'xlsx' | 'zip';
	fileName?: string;
	packageContents?: string[];
}

export interface ProgressMessage {
	id: string;
	type: 'progress';
	message: string;
	step: number;
	totalSteps: number;
	timestamp: string;
}

export interface ExportResponse {
	type: 'response';
	message: string;
	downloadUrl: string;
	fileType: 'docx' | 'xlsx' | 'zip';
	fileName?: string;
	packageContents?: string[];
}

export interface ConversationSummary {
	id: number;
	name: string;
	lastMessage: string;
	lastMessageTime: string;
	messageCount: number;
}

export interface ConversationContext {
	projects: Project[];
	organizations: Organization[];
	// Add other context properties as needed
}

export interface ProcessingStage {
	stage: string;
	message: string;
	timestamp: string;
	step?: number;
	totalSteps?: number;
	downloadUrl?: string;
	fileType?: 'docx' | 'xlsx' | 'zip';
	fileName?: string;
	packageContents?: string[];
}

export interface AIResponseMetadata {
	ai_provider: string;
	ai_version: string;
	model_used: string;
	data_source: string;
	processing_time?: number;
	projects_found?: number;
	citations?: any[];
	logs?: {
		question: string;
		model_used: string;
		phases: string[];
		total_processing_time_ms: number;
		projects_retrieved: number;
		projects_processed: number;
		success: boolean;
		average_relevance_score: number;
	};
	context?: any;
	follow_up_suggestions?: string[];
}

export interface StreamingEvent {
	type: 'stage' | 'token' | 'complete' | 'error';
	data: any;
}

// Type guard functions
export function isStreamingMessage(obj: any): obj is StreamingMessage {
	return (
		obj &&
		typeof obj.id === 'string' &&
		typeof obj.text === 'string' &&
		['user', 'ai', 'system'].includes(obj.sender) &&
		typeof obj.timestamp === 'string'
	);
}

export function isCitation(obj: any): obj is Citation {
	return (
		obj &&
		typeof obj.id === 'string' &&
		typeof obj.title === 'string'
	);
}

// Utility functions
export function formatTimestamp(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: string | Date): string {
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return date.toLocaleDateString();
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}
