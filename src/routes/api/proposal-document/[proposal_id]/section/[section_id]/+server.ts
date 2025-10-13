import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SectionUpdateRequest, SectionUpdateResponse } from '$lib/types/proposal';

// Mock section data for testing
const mockSections: Record<string, any> = {
  'excellence.objectives': {
    section_id: 'excellence.objectives',
    section_name: 'Objectives',
    content: `## Project Objectives

Our project aims to develop an innovative AI-powered cybersecurity platform that addresses the growing challenges in digital security.`,
    word_count: 850,
    estimated_pages: 1.7,
    last_updated: '2025-10-11T14:30:00Z',
    quality_score: 0.85,
    status: 'complete'
  },
  'excellence.methodology': {
    section_id: 'excellence.methodology',
    section_name: 'Methodology',
    content: '',
    word_count: 0,
    estimated_pages: 0,
    last_updated: '2025-10-11T10:00:00Z',
    quality_score: null,
    status: 'empty'
  }
};

export const GET: RequestHandler = async ({ params }) => {
  const { proposal_id, section_id } = params;
  
  if (isNaN(parseInt(proposal_id))) {
    return json({ error: 'Invalid proposal ID' }, { status: 400 });
  }
  
  const section = mockSections[section_id];
  
  if (!section) {
    return json({ error: 'Section not found' }, { status: 404 });
  }
  
  return json(section);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const { proposal_id, section_id } = params;
  
  if (isNaN(parseInt(proposal_id))) {
    return json({ error: 'Invalid proposal ID' }, { status: 400 });
  }
  
  try {
    const update: SectionUpdateRequest = await request.json();
    
    if (!update.content) {
      return json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Update the section in our mock data
    if (mockSections[section_id]) {
      mockSections[section_id].content = update.content;
      mockSections[section_id].word_count = update.content.split(/\s+/).length;
      mockSections[section_id].estimated_pages = Math.ceil(mockSections[section_id].word_count / 500);
      mockSections[section_id].last_updated = new Date().toISOString();
      mockSections[section_id].quality_score = update.metadata?.quality_score || 0.8;
      mockSections[section_id].status = mockSections[section_id].word_count > 100 ? 'complete' : 
                                      mockSections[section_id].word_count > 0 ? 'draft' : 'empty';
    }
    
    const response: SectionUpdateResponse = {
      success: true,
      message: 'Section updated successfully',
      word_count: mockSections[section_id].word_count,
      estimated_pages: mockSections[section_id].estimated_pages
    };
    
    return json(response);
  } catch (error) {
    console.error('Error updating section:', error);
    return json({ error: 'Failed to update section' }, { status: 500 });
  }
};