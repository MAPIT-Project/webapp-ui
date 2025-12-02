import { processRawCitationData, validateCitationData } from './citationConverter';
import type { ApiCitation } from './citationConverter';

/**
 * Test data that matches the API response structure from the user's example
 */
const testApiCitations: ApiCitation[] = [
	{
		number: 1,
		text: "Annex A - (PCP)",
		chunk_id: 34566,
		metadata: {
			source: "intelligent_retrieval",
			document_type: "general_annexes",
			primary_intent: "general",
			relevance_score: 0.167704,
			scope_identifier: undefined
		},
		source_type: "intelligent_retrieval",
		content_snippet: "cases of applications for joint calls with third countries (including scientific and technological organisations or agencies from third countries), international organisations or non -profit legal ent..."
	},
	{
		number: 2,
		text: "Annex A - A-C);",
		chunk_id: 34520,
		metadata: {
			source: "intelligent_retrieval",
			document_type: "general_annexes",
			primary_intent: "general",
			relevance_score: 0.10937,
			scope_identifier: undefined
		},
		source_type: "intelligent_retrieval",
		content_snippet: "## A-C); – award criteria, mandatory documents and evaluation procedure (Annexes D -F); – legal and financial set -up of the grant agreements (Annex G); – specific conditions applying to actions which..."
	},
	{
		number: 3,
		text: "HE Work Programme 2025 - 14. General Annexes",
		chunk_id: 32056,
		metadata: {
			source: "intelligent_retrieval",
			document_type: "general_annexes",
			primary_intent: "general",
			relevance_score: 0.106483,
			scope_identifier: undefined
		},
		source_type: "intelligent_retrieval",
		content_snippet: "Part 1 4 - Page 1 of 44 EN Horizon Europe Work Programme 2025 14. General Annexes (European Commission Decision C(2025) 2779 of 14 May 2025) Part 1 4 - Page 2 of 44 Table of contents INTRODUCTION ....."
	}
];

/**
 * Test function to verify citation conversion and display
 */
export function testCitationConversion() {
	console.log('🧪 Testing citation conversion...');
	
	try {
		// Test validation
		console.log('📋 Validating test data...');
		const isValid = testApiCitations.every(validateCitationData);
		console.log('✅ Test data validation:', isValid);
		
		// Test conversion
		console.log('🔄 Converting API citations...');
		const enhancedCitations = processRawCitationData(testApiCitations);
		console.log('✅ Conversion successful. Processed', enhancedCitations.length, 'citations');
		
		// Test individual citation properties
		enhancedCitations.forEach((citation, index) => {
			console.log(`\n📄 Citation ${citation.id}:`);
			console.log(`  Title: ${citation.displayTitle}`);
			console.log(`  Snippet: ${citation.shortSnippet}`);
			console.log(`  Document Type: ${citation.documentTypeDisplay}`);
			console.log(`  Source Type: ${citation.sourceTypeDisplay}`);
			console.log(`  Relevance: ${citation.relevancePercentage}%`);
			console.log(`  Is High Relevance: ${citation.isHighRelevance}`);
			console.log(`  Metadata:`, citation.metadata);
		});
		
		// Test sorting
		console.log('\n🔄 Testing sorting by relevance...');
		const sortedCitations = [...enhancedCitations].sort((a, b) => {
			const scoreA = a.metadata?.relevanceScore || 0;
			const scoreB = b.metadata?.relevanceScore || 0;
			return scoreB - scoreA;
		});
		console.log('✅ Sort order:', sortedCitations.map(c => `${c.id} (${c.relevancePercentage}%)`));
		
		// Test filtering
		console.log('\n🔍 Testing filtering...');
		const highRelevanceCitations = enhancedCitations.filter(c => c.isHighRelevance);
		console.log('✅ High relevance citations:', highRelevanceCitations.map(c => c.id));
		
		console.log('\n🎉 All tests passed!');
		return enhancedCitations;
		
	} catch (error) {
		console.error('❌ Test failed:', error);
		return [];
	}
}

/**
 * Test function to simulate the complete workflow
 */
export function testCompleteWorkflow() {
	console.log('🔄 Testing complete citation workflow...');
	
	try {
		// Simulate API response
		const mockApiResponse = {
			messages: [
				{
					id: 1622,
					conversation_id: 235,
					text: "The provided text snippets detail various aspects of the Horizon Europe Work Programme 2025 General Annexes, including evaluation procedures, award criteria, submission requirements, and grant agreement setup [2, 3].",
					sender: "ai",
					citations: testApiCitations
				}
			]
		};
		
		// Process the message
		const message = mockApiResponse.messages[0];
		console.log('📝 Processing message:', message.text.substring(0, 100) + '...');
		
		// Convert citations
		const enhancedCitations = processRawCitationData(message.citations);
		console.log('✅ Citations converted:', enhancedCitations.length);
		
		// Test citation marker rendering (simplified)
		const textWithMarkers = message.text;
		const citationMarkers = textWithMarkers.match(/\[(\d+)\]/g) || [];
		console.log('🏷️ Found citation markers:', citationMarkers);
		
		// Verify all markers have corresponding citations
		const markerIds = citationMarkers.map(marker => marker.match(/\[(\d+)\]/)?.[1]).filter((id): id is string => Boolean(id));
		const citationIds = enhancedCitations.map(c => c.id);
		const allMarkersValid = markerIds.every(id => citationIds.includes(id));
		console.log('✅ All citation markers have valid citations:', allMarkersValid);
		
		console.log('\n🎉 Complete workflow test passed!');
		return {
			message,
			enhancedCitations,
			markerIds,
			allMarkersValid
		};
		
	} catch (error) {
		console.error('❌ Workflow test failed:', error);
		return null;
	}
}

/**
 * Run all tests (call this function in development console)
 */
export function runAllCitationTests() {
	console.log('🚀 Starting citation system tests...\n');
	
	const conversionResult = testCitationConversion();
	console.log('\n' + '='.repeat(50) + '\n');
	
	const workflowResult = testCompleteWorkflow();
	console.log('\n' + '='.repeat(50) + '\n');
	
	console.log('📊 Test Summary:');
	console.log('- Conversion Test:', conversionResult.length > 0 ? '✅ PASSED' : '❌ FAILED');
	console.log('- Workflow Test:', workflowResult ? '✅ PASSED' : '❌ FAILED');
	
	return {
		conversionResult,
		workflowResult
	};
}

// Export for use in development
if (typeof window !== 'undefined') {
	(window as any).testCitations = runAllCitationTests;
}