import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock call database (simulating EU Funding & Tenders Portal)
const MOCK_CALLS: Record<string, { title: string; type: string }> = {
  'HORIZON-CL5-2025-D3-01': {
    title: 'Technologies for Green Hydrogen Production',
    type: 'RIA'
  },
  'HORIZON-CL3-2024-CS-01': {
    title: 'AI-Powered Cybersecurity Operations',
    type: 'IA'
  },
  'HORIZON-HLTH-2024-DISEASE-03-01': {
    title: 'Novel Therapies for Rare Diseases',
    type: 'RIA'
  },
  'HORIZON-WIDERA-2024-TALENTS-01': {
    title: 'ERA Talents',
    type: 'CSA'
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const callId = url.searchParams.get('call_id');

  if (!callId) {
    return json({ error: 'Missing call_id' }, { status: 400 });
  }

  // simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const call = MOCK_CALLS[callId];

  if (call) {
    return json(call);
  }

  // Fallback for unknown calls - try to infer or just return generic
  if (callId.startsWith('HORIZON')) {
     return json({
       title: `New Horizon Project (${callId})`,
       type: callId.includes('RIA') ? 'RIA' : 'IA' // Naive inference
     });
  }

  return json({ error: 'Call not found' }, { status: 404 });
};
