export interface FeedbackSubmission {
  conversation_id: string;
  message_id?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback_type: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'other';
  feedback_text?: string;
  query_text?: string;
  response_text?: string;
  tools_used?: string[];
  query_type?: string;
  response_time_ms?: number;
}

export interface FeedbackSummary {
  total_feedback: number;
  average_rating: number;
  helpful_count: number;
  not_helpful_count: number;
  incorrect_count: number;
  incomplete_count: number;
  other_count: number;
  satisfaction_rate: number;
  period_days: number;
}
