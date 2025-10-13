import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ProposalProgress } from '$lib/types/proposal';

// Mock progress data for testing
const mockProgress: ProposalProgress = {
  total_sections: 12,
  completed_sections: 3,
  completion_percentage: 25,
  total_words: 1920,
  estimated_pages: 3.8,
  average_quality: 0.8
};

export const GET: RequestHandler = async ({ params }) => {
  const proposalId = parseInt(params.proposal_id);
  
  if (isNaN(proposalId)) {
    return json({ error: 'Invalid proposal ID' }, { status: 400 });
  }
  
  // In a real implementation, you would calculate progress from database
  // For now, return mock data
  return json({
    proposal_id: proposalId,
    overall_progress: mockProgress,
    sections: [
      {
        section_id: 'excellence.objectives',
        section_name: 'Objectives',
        word_count: 850,
        status: 'complete',
        quality_score: 0.85,
        estimated_pages: 1.7
      },
      {
        section_id: 'excellence.methodology',
        section_name: 'Methodology',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'excellence.state_of_art',
        section_name: 'State of the Art',
        word_count: 420,
        status: 'complete',
        quality_score: 0.75,
        estimated_pages: 0.8
      },
      {
        section_id: 'excellence.innovation',
        section_name: 'Innovation',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'impact.impact_strategy',
        section_name: 'Impact Strategy',
        word_count: 650,
        status: 'complete',
        quality_score: 0.80,
        estimated_pages: 1.3
      },
      {
        section_id: 'impact.dissemination',
        section_name: 'Dissemination',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'impact.communication',
        section_name: 'Communication',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'impact.exploitation',
        section_name: 'Exploitation',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'implementation.work_plan',
        section_name: 'Work Plan',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'implementation.consortium',
        section_name: 'Consortium',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'implementation.resources',
        section_name: 'Resources',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      },
      {
        section_id: 'implementation.risk_management',
        section_name: 'Risk Management',
        word_count: 0,
        status: 'empty',
        quality_score: null,
        estimated_pages: 0
      }
    ]
  });
};