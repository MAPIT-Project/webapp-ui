import type { Citation } from '$lib/types/schema';

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
			const citation = citationMap.get(citationId)!;
			const citationData = JSON.stringify(citation).replace(/'/g, "'");
			return `<span class="citation-marker inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer dark:text-blue-400 dark:bg-blue-900 dark:hover:bg-blue-800" data-citation-id="${citation.id}" title="${citation.title}" data-citation='${citationData}'>${citation.id}</span>`;
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