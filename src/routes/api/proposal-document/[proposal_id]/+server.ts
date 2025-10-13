import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Proposal } from '$lib/types/proposal';

// Mock proposal data for testing
const mockProposal: Proposal = {
  proposal_id: 123,
  call_id: 'HORIZON-CL3-2025-02-CS-ECCC-01',
  proposal_title: 'AI-Powered Cybersecurity Platform',
  proposal_acronym: 'AICP',
  proposal_type: 'RIA',
  status: 'draft',
  created_at: '2025-10-11T10:00:00Z',
  updated_at: '2025-10-11T14:30:00Z',
  sections: [
    {
      section_id: 'excellence.objectives',
      section_name: 'Objectives',
      content: `## Project Objectives

Our project aims to develop an innovative AI-powered cybersecurity platform that addresses the growing challenges in digital security. The primary objectives include:

1. **Enhanced Threat Detection**: Develop machine learning algorithms capable of identifying and predicting cyber threats in real-time with 95% accuracy.

2. **Automated Response Systems**: Create intelligent response mechanisms that can automatically neutralize detected threats without human intervention.

3. **Adaptive Learning**: Implement continuous learning capabilities that allow the system to evolve and adapt to new types of cyber threats.

4. **User-Friendly Interface**: Design an intuitive dashboard that provides comprehensive security insights while remaining accessible to non-technical users.

5. **Scalable Architecture**: Ensure the platform can handle enterprise-level requirements while maintaining optimal performance.

The project will leverage cutting-edge AI technologies including deep learning, natural language processing, and behavioral analysis to create a comprehensive security solution that protects against both known and emerging threats.`,
      word_count: 850,
      estimated_pages: 1.7,
      last_updated: '2025-10-11T14:30:00Z',
      quality_score: 0.85,
      status: 'complete'
    },
    {
      section_id: 'excellence.methodology',
      section_name: 'Methodology',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'excellence.state_of_art',
      section_name: 'State of the Art',
      content: `## State of the Art

Current cybersecurity solutions face several limitations in addressing modern threats. Traditional signature-based detection methods are increasingly ineffective against sophisticated attacks that use polymorphic code and zero-day vulnerabilities.

Recent advances in AI and machine learning have shown promise in addressing these challenges. Deep learning models have demonstrated remarkable capabilities in pattern recognition and anomaly detection, making them well-suited for cybersecurity applications.

However, existing AI-powered security solutions often require extensive computational resources and specialized expertise to implement effectively. There remains a significant gap in the market for accessible, scalable, and user-friendly AI security solutions that can be adopted by organizations of all sizes.

Our project builds upon the latest research in:
- Deep learning for threat detection
- Behavioral analysis algorithms
- Automated incident response systems
- Explainable AI for security applications`,
      word_count: 420,
      estimated_pages: 0.8,
      last_updated: '2025-10-11T12:15:00Z',
      quality_score: 0.75,
      status: 'complete'
    },
    {
      section_id: 'excellence.innovation',
      section_name: 'Innovation',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'impact.impact_strategy',
      section_name: 'Impact Strategy',
      content: `## Impact Strategy

Our AI-powered cybersecurity platform will deliver significant impact across multiple dimensions:

### Scientific Impact
- Advance the state of the art in AI-driven threat detection
- Publish research findings in leading security and AI conferences
- Develop novel algorithms for real-time threat analysis

### Economic Impact
- Reduce cybersecurity costs for SMEs by up to 40%
- Create new market opportunities for AI security solutions
- Generate an estimated €50M in economic value within 5 years

### Societal Impact
- Enhance digital security for millions of users
- Protect critical infrastructure from cyber attacks
- Increase trust in digital technologies

### European Competitiveness
- Strengthen Europe's position in the global cybersecurity market
- Reduce dependency on non-European security solutions
- Create high-skilled jobs in the AI security sector`,
      word_count: 650,
      estimated_pages: 1.3,
      last_updated: '2025-10-11T13:45:00Z',
      quality_score: 0.80,
      status: 'complete'
    },
    {
      section_id: 'impact.dissemination',
      section_name: 'Dissemination',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'impact.communication',
      section_name: 'Communication',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'impact.exploitation',
      section_name: 'Exploitation',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'implementation.work_plan',
      section_name: 'Work Plan',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'implementation.consortium',
      section_name: 'Consortium',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'implementation.resources',
      section_name: 'Resources',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    },
    {
      section_id: 'implementation.risk_management',
      section_name: 'Risk Management',
      content: '',
      word_count: 0,
      estimated_pages: 0,
      last_updated: '2025-10-11T10:00:00Z',
      quality_score: null,
      status: 'empty'
    }
  ],
  progress: {
    total_sections: 12,
    completed_sections: 3,
    completion_percentage: 25,
    total_words: 1920,
    estimated_pages: 3.8,
    average_quality: 0.8
  }
};

export const GET: RequestHandler = async ({ params }) => {
  const proposalId = parseInt(params.proposal_id);
  
  if (isNaN(proposalId)) {
    return json({ error: 'Invalid proposal ID' }, { status: 400 });
  }
  
  // In a real implementation, you would fetch from database
  // For now, return mock data
  return json(mockProposal);
};