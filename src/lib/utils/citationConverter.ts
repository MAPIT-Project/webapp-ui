import type { Citation } from '$lib/types/schema';

/**
 * API Citation interface - matches the structure returned by the backend
 */
export interface ApiCitation {
	number: number;
	text: string;
	chunk_id: number;
	metadata: {
		source: string;
		document_type: string;
		primary_intent: string;
		relevance_score: number;
		scope_identifier?: string;
		call_id?: string;
		is_structured?: boolean;
		priority?: string;
	};
	source_type: string;
	content_snippet: string;
}

/**
 * Enhanced Citation interface with additional computed properties
 */
export interface EnhancedCitation extends Citation {
	// Original API data for reference
	apiData?: ApiCitation;
	
	// Computed properties for better UI display
	relevancePercentage?: number;
	displayTitle?: string;
	shortSnippet?: string;
	isHighRelevance?: boolean;
	documentTypeDisplay?: string;
	sourceTypeDisplay?: string;
}

/**
 * Converts API citation format to frontend Citation format with enhanced metadata
 * @param apiCitations - Array of citations from API response
 * @returns Array of enhanced Citation objects
 */
export function convertApiCitations(apiCitations: ApiCitation[]): EnhancedCitation[] {
	if (!apiCitations || !Array.isArray(apiCitations)) {
		console.warn('Invalid citations data received:', apiCitations);
		return [];
	}

	return apiCitations.map((apiCitation, index) => {
		try {
			// Ensure we have a valid ID
			const citationId = apiCitation.number?.toString() || `citation-${index}-${Date.now()}`;
			
			// Create enhanced citation with proper field mapping
			const enhancedCitation: EnhancedCitation = {
				// Core citation fields
				id: citationId,
				title: apiCitation.text || `Source ${apiCitation.number || index + 1}`,
				snippet: apiCitation.content_snippet || '',
				url: undefined, // API doesn't provide URL
				
				// Enhanced metadata
				metadata: {
					source: apiCitation.metadata.source || 'unknown',
					callId: apiCitation.metadata.call_id,
					isStructured: apiCitation.metadata.is_structured,
					priority: apiCitation.metadata.priority,
					sourceType: apiCitation.source_type || 'unknown',
					chunkId: apiCitation.chunk_id?.toString() || '0',
					relevanceScore: apiCitation.metadata.relevance_score || 0,
					documentType: apiCitation.metadata.document_type || 'unknown'
				},
				
				// Store original API data for reference
				apiData: apiCitation,
				
				// Computed properties for better UI
				relevancePercentage: Math.round((apiCitation.metadata.relevance_score || 0) * 100),
				displayTitle: generateDisplayTitle(apiCitation),
				shortSnippet: generateShortSnippet(apiCitation.content_snippet),
				isHighRelevance: (apiCitation.metadata.relevance_score || 0) > 0.1,
				documentTypeDisplay: formatDocumentType(apiCitation.metadata.document_type),
				sourceTypeDisplay: formatSourceType(apiCitation.source_type)
			};

			return enhancedCitation;
		} catch (error) {
			console.error('Error converting citation:', error, apiCitation);
			// Return a fallback citation to prevent UI crashes
			return createFallbackCitation(apiCitation, index);
		}
	});
}

/**
 * Generates a display-friendly title from the citation data
 */
function generateDisplayTitle(apiCitation: ApiCitation): string {
	const title = apiCitation.text || `Source ${apiCitation.number}`;
	
	// Clean up common document patterns
	let cleanTitle = title
		.replace(/^##\s*/, '') // Remove markdown headers
		.replace(/\s*-\s*Page\s*\d+\s*of\s*\d+.*$/, '') // Remove page references
		.replace(/\s*\(European Commission.*?\)/, '') // Remove commission references
		.replace(/\s*EN\s+Horizon Europe.*$/, '') // Remove work programme references
		.trim();
	
	// If after cleaning we have nothing meaningful, use a descriptive title
	if (!cleanTitle || cleanTitle.length < 10) {
		const docType = apiCitation.metadata.document_type;
		if (docType) {
			cleanTitle = `${docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Section ${apiCitation.number}`;
		} else {
			cleanTitle = `Document Section ${apiCitation.number}`;
		}
	}
	
	// Truncate very long titles
	if (cleanTitle.length > 100) {
		return cleanTitle.substring(0, 97) + '...';
	}
	
	return cleanTitle;
}

/**
 * Generates a short snippet for display in the sources list
 */
function generateShortSnippet(snippet: string): string {
	if (!snippet || snippet.length <= 150) {
		return snippet;
	}
	
	return snippet.substring(0, 147) + '...';
}

/**
 * Formats document type for display
 */
function formatDocumentType(documentType: string): string {
	if (!documentType) return 'Unknown';
	
	// Convert snake_case to Title Case
	return documentType
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Formats source type for display
 */
function formatSourceType(sourceType: string): string {
	if (!sourceType) return 'Unknown';
	
	// Handle special cases
	switch (sourceType) {
		case 'intelligent_retrieval':
			return 'Intelligent Retrieval';
		case 'semantic_search':
			return 'Semantic Search';
		case 'keyword_search':
			return 'Keyword Search';
		default:
			// Convert snake_case to Title Case
			return sourceType
				.split('_')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
	}
}

/**
 * Creates a fallback citation when conversion fails
 */
function createFallbackCitation(apiCitation: any, index: number): EnhancedCitation {
	return {
		id: apiCitation.number?.toString() || index.toString(),
		title: apiCitation.text || `Source ${index + 1}`,
		snippet: apiCitation.content_snippet || 'Content unavailable',
		url: undefined,
		metadata: {
			source: 'unknown',
			sourceType: 'unknown',
			chunkId: '0',
			relevanceScore: 0,
			documentType: 'unknown'
		},
		relevancePercentage: 0,
		displayTitle: `Source ${index + 1}`,
		shortSnippet: 'Content unavailable',
		isHighRelevance: false,
		documentTypeDisplay: 'Unknown',
		sourceTypeDisplay: 'Unknown'
	};
}

/**
 * Sorts citations by relevance score (highest first)
 */
export function sortCitationsByRelevance(citations: EnhancedCitation[]): EnhancedCitation[] {
	return [...citations].sort((a, b) => {
		const scoreA = a.metadata?.relevanceScore || 0;
		const scoreB = b.metadata?.relevanceScore || 0;
		return scoreB - scoreA;
	});
}

/**
 * Filters citations by relevance threshold
 */
export function filterCitationsByRelevance(
	citations: EnhancedCitation[],
	minRelevance: number = 0.01
): EnhancedCitation[] {
	return citations.filter(citation => 
		(citation.metadata?.relevanceScore || 0) >= minRelevance
	);
}

/**
 * Groups citations by document type
 */
export function groupCitationsByDocumentType(citations: EnhancedCitation[]): Record<string, EnhancedCitation[]> {
	return citations.reduce((groups, citation) => {
		const documentType = citation.documentTypeDisplay || 'Unknown';
		if (!groups[documentType]) {
			groups[documentType] = [];
		}
		groups[documentType].push(citation);
		return groups;
	}, {} as Record<string, EnhancedCitation[]>);
}

/**
 * Validates citation data structure
 */
export function validateCitationData(data: any): data is ApiCitation {
	return (
		data &&
		typeof data === 'object' &&
		typeof data.number === 'number' &&
		typeof data.text === 'string' &&
		typeof data.chunk_id === 'number' &&
		typeof data.metadata === 'object' &&
		typeof data.source_type === 'string' &&
		typeof data.content_snippet === 'string'
	);
}

/**
 * Processes raw API citation data with validation and error handling
 */
export function processRawCitationData(rawData: any): EnhancedCitation[] {
	try {
		// Handle different data formats
		let citations: any[] = [];
		
		if (Array.isArray(rawData)) {
			citations = rawData;
		} else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.citations)) {
			citations = rawData.citations;
		} else {
			console.warn('Unexpected citation data format:', rawData);
			return [];
		}
		
		// Validate and convert citations
		const validCitations = citations.filter(validateCitationData);
		const convertedCitations = convertApiCitations(validCitations);
		
		// Sort by relevance and return
		return sortCitationsByRelevance(convertedCitations);
		
	} catch (error) {
		console.error('Error processing citation data:', error);
		return [];
	}
}