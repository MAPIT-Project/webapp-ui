export interface ProposalSession {
  session_id: string;
  proposal_id: number;
  call_id: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'expired';
  active_section_id: string | null;
  completion_percentage: number;
  total_words: number;
  sections: Record<string, SessionSection>;
  created_at: string;
}

export interface SessionSection {
  section_id: string;
  section_name: string;
  content: string;
  word_count: number;
  quality_score: number | null;
  status: 'empty' | 'draft' | 'in_review' | 'complete';
  suggestions_count: number;
  gaps_count: number;
  lock_status: 'unlocked' | 'locked_by_ai' | 'locked_by_user';
  is_dirty: boolean;
  version: number;
  last_updated: string | null;
}

// Chat & Event Types
export type SSEEventType = 
  | 'status'
  | 'agent_thinking'
  | 'tool_call'
  | 'tool_result'
  | 'section_update'
  | 'token'
  | 'agent_complete'
  | 'session_state'
  | 'error';

export interface BaseSSEEvent {
  type: SSEEventType;
}

export interface StatusEvent extends BaseSSEEvent {
  type: 'status';
  stage: string;
  message: string;
}

export interface AgentThinkingEvent extends BaseSSEEvent {
  type: 'agent_thinking';
  iteration: number;
  thought: string;
  action: 'call_tools' | 'conclude' | 'analyze_results';
}

export interface ToolCallEvent extends BaseSSEEvent {
  type: 'tool_call';
  iteration: number;
  tool_name: string;
  parameters: Record<string, unknown>;
  reasoning: string;
}

export interface ToolResultEvent extends BaseSSEEvent {
  type: 'tool_result';
  tool_name: string;
  success: boolean;
  result_count: number;
  execution_time_ms: number;
}

export interface SectionUpdateEvent extends BaseSSEEvent {
  type: 'section_update';
  section_id: string;
  tool_name: string;
  content: string;
}

export interface TokenEvent extends BaseSSEEvent {
  type: 'token';
  content: string;
}

export interface AgentCompleteEvent extends BaseSSEEvent {
  type: 'agent_complete';
  result: {
    answer: string;
    success: boolean;
    sections_affected: string[];
    iterations: number;
    confidence: number;
    total_time_ms: number;
    proposal_intent: string | null;
  };
}

export interface SessionStateEvent extends BaseSSEEvent {
  type: 'session_state';
  completion_percentage: number;
  total_words: number;
  sections_affected: string[];
}

export interface ErrorEvent extends BaseSSEEvent {
  type: 'error';
  error: string;
}

export type SSEEvent =
  | StatusEvent
  | AgentThinkingEvent
  | ToolCallEvent
  | ToolResultEvent
  | SectionUpdateEvent
  | TokenEvent
  | AgentCompleteEvent
  | SessionStateEvent
  | ErrorEvent;

// Evaluation Types
export interface EvaluationResponse {
  section_id: string;
  score: number;
  max_score: number;
  criterion_scores: CriterionScore[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  evaluated: boolean;
}

export interface CriterionScore {
  name: string;
  score: number;
  max: number;
  feedback: string;
}

// Gap Analysis Types
export interface GapAnalysisResponse {
  section_id: string;
  gaps: Gap[];
  gap_count: number;
  analyzed: boolean;
}

export interface Gap {
  id: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'content' | 'structure' | 'evidence' | 'compliance';
  suggested_fix: string;
  effort: 'quick' | 'medium' | 'substantial';
}
