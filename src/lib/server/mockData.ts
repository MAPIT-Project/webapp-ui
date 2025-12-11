import type { Proposal } from '$lib/types/proposal';

export const mockProposals: Proposal[] = [
  {
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
    // ... other sections can be added here or generated dynamically if needed
    ],
    progress: {
      total_sections: 12,
      completed_sections: 1,
      completion_percentage: 8,
      total_words: 850,
      estimated_pages: 1.7,
      average_quality: 0.85
    }
  }
];
