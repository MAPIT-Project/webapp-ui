import type { FeedbackSubmission, FeedbackSummary } from '$lib/types/feedback';

export class FeedbackService {
  private static instance: FeedbackService;

  private constructor() {}

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  async submitFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; feedback_id: number; message: string }> {
    try {
      // In a real implementation, this would post to the backend
      // For now, we'll just log it to console as the backend endpoint might not be ready
      // const response = await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedback)
      // });
      // return await response.json();

      console.log('Submitting feedback:', feedback);
      
      // Simulate API call
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  success: true,
                  feedback_id: Date.now(),
                  message: 'Thank you for your feedback!'
              });
          }, 500);
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getFeedbackSummary(): Promise<FeedbackSummary> {
      // Mock data
      return {
          total_feedback: 156,
          average_rating: 4.2,
          helpful_count: 98,
          not_helpful_count: 23,
          incorrect_count: 12,
          incomplete_count: 18,
          other_count: 5,
          satisfaction_rate: 78.5,
          period_days: 7
      };
  }
}

export const feedbackService = FeedbackService.getInstance();
