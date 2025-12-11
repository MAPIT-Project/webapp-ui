import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Proposal } from '$lib/types/proposal';
import { mockProposals } from '$lib/server/mockData';

// Generate a new proposal ID
function generateNewProposalId(): number {
  return Math.max(...mockProposals.map(p => p.proposal_id), 0) + 1;
}

// GET /api/proposal-document - Get all proposals
export const GET: RequestHandler = async () => {
  return json(mockProposals);
};

// POST /api/proposal-document - Create a new proposal
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.call_id || !body.proposal_title) {
      return json({ error: 'Missing required fields: call_id, proposal_title' }, { status: 400 });
    }
    
    // Create a new proposal
    const newProposalId = generateNewProposalId();
    const newProposal: Proposal = {
      proposal_id: newProposalId,
      call_id: body.call_id,
      proposal_title: body.proposal_title,
      proposal_acronym: body.proposal_acronym || '',
      proposal_type: body.proposal_type || 'RIA',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sections: [], // Initialize with empty sections or default template
      progress: {
        total_sections: 12,
        completed_sections: 0,
        completion_percentage: 0,
        total_words: 0,
        estimated_pages: 0,
        average_quality: 0
      }
    };
    
    // Add to our shared mock data
    mockProposals.push(newProposal);
    
    return json({
      success: true,
      proposal: newProposal,
      message: 'Proposal created successfully'
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return json({ error: 'Failed to create proposal' }, { status: 500 });
  }
};