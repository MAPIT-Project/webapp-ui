import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockProposals } from '$lib/server/mockData';

export const GET: RequestHandler = async ({ params }) => {
  const proposalId = parseInt(params.proposal_id);
  
  if (isNaN(proposalId)) {
    return json({ error: 'Invalid proposal ID' }, { status: 400 });
  }

  const proposal = mockProposals.find(p => p.proposal_id === proposalId);

  if (proposal) {
    return json(proposal);
  }
  
  return json({ error: 'Proposal not found' }, { status: 404 });
};