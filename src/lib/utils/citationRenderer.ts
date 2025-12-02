import type { Citation } from '$lib/types/schema';
import type { EnhancedCitation } from '$lib/utils/citationConverter';

/**
 * Renders text with citation markers replaced by interactive components
 * @param text - The text containing citation markers like [1], [2], etc.
 * @param citations - Array of citation objects
 * @param CitationComponent - Svelte component class for rendering citations
 * @returns Array of text segments and citation components
 */
export function renderTextWithCitations(
	text: string,
	citations: Citation[] = [],
	CitationComponent: any
): Array<{ type: 'text' | 'citation'; content: string | Citation }> {
	if (!citations.length) {
		return [{ type: 'text', content: text }];
	}

	// Create a map of citation IDs to citation objects for quick lookup
	const citationMap = new Map<string, Citation>();
	citations.forEach(citation => {
		citationMap.set(citation.id, citation);
	});

	// Find all citation markers in the text
	const citationRegex = /\[(\d+)\]/g;
	const segments: Array<{ type: 'text' | 'citation'; content: string | Citation }> = [];
	let lastIndex = 0;
	let match;

	while ((match = citationRegex.exec(text)) !== null) {
		const citationId = match[1];
		const matchStart = match.index;
		const matchEnd = matchStart + match[0].length;

		// Add text before the citation marker
		if (matchStart > lastIndex) {
			const textSegment = text.substring(lastIndex, matchStart);
			if (textSegment) {
				segments.push({ type: 'text', content: textSegment });
			}
		}

		// Add the citation if it exists in our map
		if (citationMap.has(citationId)) {
			segments.push({
				type: 'citation',
				content: citationMap.get(citationId)!
			});
		} else {
			// If citation not found, keep the original marker
			segments.push({ type: 'text', content: match[0] });
		}

		lastIndex = matchEnd;
	}

	// Add any remaining text after the last citation
	if (lastIndex < text.length) {
		const remainingText = text.substring(lastIndex);
		if (remainingText) {
			segments.push({ type: 'text', content: remainingText });
		}
	}

	return segments;
}

/**
 * Renders text with citation markers replaced by HTML spans
 * This is used when we want to render citations as simple HTML elements
 * @param text - The text containing citation markers like [1], [2], etc.
 * @param citations - Array of citation objects
 * @returns HTML string with citation markers replaced by spans
 */
export function renderTextWithCitationSpans(
	text: string,
	citations: Citation[] = []
): string {
	if (!citations.length) {
		return text;
	}

	// Create a map of citation IDs to citation objects for quick lookup
	const citationMap = new Map<string, Citation>();
	citations.forEach(citation => {
		citationMap.set(citation.id, citation);
	});

	// Replace citation markers with HTML spans
	const html = text.replace(/\[(\d+)\]/g, (match, citationId) => {
		if (citationMap.has(citationId)) {
			const citationObj = citationMap.get(citationId)!;
			const enhancedCitation = citationObj as EnhancedCitation;
			const citationData = JSON.stringify(citationObj).replace(/'/g, "'");
			
			// Determine styling based on relevance
			const isHighRelevance = enhancedCitation.isHighRelevance;
			const relevancePercentage = enhancedCitation.relevancePercentage || 0;
			
			const baseClasses = "citation-marker inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full hover:scale-110 transition-all duration-200 cursor-pointer border";
			const colorClasses = isHighRelevance
				? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
				: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30";
			
			const title = enhancedCitation.displayTitle || enhancedCitation.title || `Source ${citationId}`;
			const tooltip = `${title} (Relevance: ${relevancePercentage}%)`;
			
			return `<span class="${baseClasses} ${colorClasses}" data-citation-id="${citationId}" title="${tooltip}" data-citation='${citationData}'>${citationId}</span>`;
		}
		return match;
	});

	return html;
}

/**
 * Extracts citation IDs from text using regex
 * @param text - The text containing citation markers
 * @returns Array of citation IDs
 */
export function extractCitationIds(text: string): string[] {
	const citationRegex = /\[(\d+)\]/g;
	const citationIds: string[] = [];
	let match;

	while ((match = citationRegex.exec(text)) !== null) {
		citationIds.push(match[1]);
	}

	return citationIds;
}

/**
 * Validates if citations in text match the provided citation objects
 * @param text - The text containing citation markers
 * @param citations - Array of citation objects
 * @returns Object with validation results
 */
export function validateCitations(text: string, citations: Citation[]): {
	isValid: boolean;
	missingIds: string[];
	extraIds: string[];
} {
	const citationIdsInText = extractCitationIds(text);
	const citationIdsInObjects = citations.map(c => c.id);

	const missingIds = citationIdsInText.filter(id => !citationIdsInObjects.includes(id));
	const extraIds = citationIdsInObjects.filter(id => !citationIdsInText.includes(id));

	return {
		isValid: missingIds.length === 0 && extraIds.length === 0,
		missingIds,
		extraIds
	};
}

/**
 * Enhanced citation renderer that supports rich citation metadata
 * @param text - The text containing citation markers
 * @param citations - Array of enhanced citation objects
 * @returns HTML string with styled citation markers
 */
export function renderEnhancedCitationSpans(
	text: string,
	citations: EnhancedCitation[] = []
): string {
	if (!citations.length) {
		return text;
	}

	// Create a map of citation IDs to citation objects for quick lookup
	const citationMap = new Map<string, EnhancedCitation>();
	citations.forEach(citation => {
		citationMap.set(citation.id, citation);
	});

	// Replace citation markers with enhanced HTML spans
	const html = text.replace(/\[(\d+)\]/g, (match, citationId) => {
		if (citationMap.has(citationId)) {
			const citation = citationMap.get(citationId)!;
			const citationData = JSON.stringify(citation).replace(/'/g, "'");
			
			// Enhanced styling based on multiple factors
			const isHighRelevance = citation.isHighRelevance;
			const relevancePercentage = citation.relevancePercentage || 0;
			const documentType = citation.documentTypeDisplay || 'Unknown';
			
			let baseClasses = "citation-marker inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full hover:scale-110 transition-all duration-200 cursor-pointer border shadow-sm";
			
			// Color coding based on document type and relevance
			let colorClasses = "";
			if (isHighRelevance) {
				colorClasses = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-emerald-500/20";
			} else if (documentType.includes('Annex')) {
				colorClasses = "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30 hover:shadow-purple-500/20";
			} else {
				colorClasses = "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 hover:shadow-blue-500/20";
			}
			
			const title = citation.displayTitle || citation.title || `Source ${citation.id}`;
			const tooltip = `${title} (${documentType}, Relevance: ${relevancePercentage}%)`;
			
			return `<span class="${baseClasses} ${colorClasses}" data-citation-id="${citation.id}" title="${tooltip}" data-citation='${citationData}'>${citation.id}</span>`;
		}
		return match;
	});

	return html;
}