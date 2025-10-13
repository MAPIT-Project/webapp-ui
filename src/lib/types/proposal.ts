// Proposal-related types for the Live Proposal Editor

export interface Proposal {
  proposal_id: number;
  call_id: string;
  proposal_title: string;
  proposal_acronym: string;
  proposal_type: string;
  status: 'draft' | 'in_review' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  sections: ProposalSection[];
  progress: ProposalProgress;
}

export interface ProposalSection {
  section_id: string;
  section_name: string;
  content: string;
  word_count: number;
  estimated_pages: number;
  last_updated: string;
  quality_score: number | null;
  status: 'empty' | 'draft' | 'complete';
}

export interface ProposalProgress {
  total_sections: number;
  completed_sections: number;
  completion_percentage: number;
  total_words: number;
  estimated_pages: number;
  average_quality: number | null;
}

export interface SectionUpdateRequest {
  content: string;
  metadata?: {
    quality_score?: number;
  };
}

export interface SectionUpdateResponse {
  success: boolean;
  message: string;
  word_count: number;
  estimated_pages: number;
}

export interface ProposalStreamingEventData {
  type: 'status' | 'progress' | 'token' | 'complete' | 'error';
  stage?: string;
  message?: string;
  content?: string;
  error?: string;
  details?: string;
  routing_decision?: string;
  intent_confidence?: number;
  proposal_draft?: any;
  logs?: {
    mode: string;
    action: string;
    section_id?: string;
  };
}

// Section definitions for the proposal structure
export const PROPOSAL_SECTIONS = {
  excellence: {
    name: 'Excellence',
    subsections: {
      objectives: 'Objectives',
      methodology: 'Methodology',
      state_of_art: 'State of the Art',
      innovation: 'Innovation'
    }
  },
  impact: {
    name: 'Impact',
    subsections: {
      impact_strategy: 'Impact Strategy',
      dissemination: 'Dissemination',
      communication: 'Communication',
      exploitation: 'Exploitation'
    }
  },
  implementation: {
    name: 'Implementation',
    subsections: {
      work_plan: 'Work Plan',
      consortium: 'Consortium',
      resources: 'Resources',
      risk_management: 'Risk Management'
    }
  }
} as const;

export type SectionId = `${keyof typeof PROPOSAL_SECTIONS}.${keyof typeof PROPOSAL_SECTIONS[keyof typeof PROPOSAL_SECTIONS]['subsections']}`;

// Helper functions
export function getSectionName(sectionId: string): string {
  const parts = sectionId.split('.');
  if (parts.length !== 2) return sectionId;
  
  const [category, subsection] = parts;
  const categoryData = PROPOSAL_SECTIONS[category as keyof typeof PROPOSAL_SECTIONS];
  if (!categoryData) return sectionId;
  
  const subsectionName = categoryData.subsections[subsection as keyof typeof categoryData.subsections];
  return subsectionName || sectionId;
}

export function getSectionStatus(wordCount: number): 'empty' | 'draft' | 'complete' {
  if (wordCount === 0) return 'empty';
  if (wordCount < 100) return 'draft';
  return 'complete';
}

export function getStatusIcon(status: 'empty' | 'draft' | 'complete'): string {
  switch (status) {
    case 'complete': return '✓';
    case 'draft': return '⏳';
    case 'empty': return '⭕';
  }
}

export function getStatusColor(status: 'empty' | 'draft' | 'complete'): string {
  switch (status) {
    case 'complete': return 'text-green-500';
    case 'draft': return 'text-yellow-500';
    case 'empty': return 'text-gray-500';
  }
}

// Quick action types for the chat interface
export interface QuickAction {
  label: string;
  icon: string;
  action: string;
  description?: string;
}

export const PROPOSAL_QUICK_ACTIONS: QuickAction[] = [
  { label: "Draft next section", icon: "✍️", action: "draft_next", description: "Generate the next section of the proposal" },
  { label: "Improve current", icon: "✨", action: "improve", description: "Enhance the current section" },
  { label: "Make more specific", icon: "🎯", action: "be_specific", description: "Add specific details and metrics" },
  { label: "Add examples", icon: "💡", action: "add_examples", description: "Include relevant examples" },
  { label: "Check compliance", icon: "✓", action: "compliance", description: "Verify compliance with requirements" }
];