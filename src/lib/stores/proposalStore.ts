import { proposalService } from '$lib/clients/proposalService';
import type { 
  Proposal, 
  ProposalSection, 
  ProposalProgress, 
  SectionUpdateRequest 
} from '$lib/types/proposal';
import { getSectionStatus } from '$lib/types/proposal';
import { writable, derived, type Writable } from 'svelte/store';

// Proposal store state interface
interface ProposalState {
  proposal: Proposal | null;
  sections: ProposalSection[];
  progress: ProposalProgress | null;
  activeSection: string;
  loading: boolean;
  error: string | null;
  saving: boolean;
  lastSaved: Date | null;
}

// Create the store
const proposalStore: Writable<ProposalState> = writable<ProposalState>({
  proposal: null,
  sections: [],
  progress: null,
  activeSection: 'excellence.objectives',
  loading: false,
  error: null,
  saving: false,
  lastSaved: null
});

// Derived values
export const currentSection = derived(
  proposalStore,
  ($proposalStore) => $proposalStore.sections.find(s => s.section_id === $proposalStore.activeSection) || null
);

export const completionPercentage = derived(
  proposalStore,
  ($proposalStore) => $proposalStore.progress?.completion_percentage || 0
);

export const totalWords = derived(
  proposalStore,
  ($proposalStore) => $proposalStore.progress?.total_words || 0
);

export const estimatedPages = derived(
  proposalStore,
  ($proposalStore) => $proposalStore.progress?.estimated_pages || 0
);

// Actions
async function loadProposal(proposalId: number): Promise<void> {
  proposalStore.update(state => ({ ...state, loading: true, error: null }));

  try {
    const proposal = await proposalService.getProposalDocument(proposalId);
    
    if (!proposal) {
      proposalStore.update(state => ({ ...state, error: 'Failed to load proposal', loading: false }));
      return;
    }

    proposalStore.update(state => ({
      ...state,
      proposal,
      sections: proposal.sections,
      progress: proposal.progress,
      activeSection: state.sections.length > 0 && !state.sections.find(s => s.section_id === state.activeSection)
        ? proposal.sections[0].section_id
        : state.activeSection,
      loading: false
    }));
  } catch (error) {
    proposalStore.update(state => ({
      ...state,
      error: error instanceof Error ? error.message : 'Failed to load proposal',
      loading: false
    }));
  }
}

async function updateSection(sectionId: string, content: string): Promise<void> {
  return new Promise((resolve) => {
    proposalStore.subscribe(async (state) => {
      if (!state.proposal) {
        proposalStore.update(currentState => ({ ...currentState, error: 'No proposal loaded' }));
        resolve();
        return;
      }

      proposalStore.update(currentState => ({ ...currentState, saving: true, error: null }));

      try {
        const update: SectionUpdateRequest = { content };
        const result = await proposalService.updateProposalSection(
          state.proposal.proposal_id,
          sectionId,
          update
        );

        if (!result?.success) {
          proposalStore.update(currentState => ({ ...currentState, error: 'Failed to update section', saving: false }));
          resolve();
          return;
        }

        // Update local section data
        proposalStore.update(currentState => {
          const updatedSections = currentState.sections.map(section => 
            section.section_id === sectionId
              ? {
                  ...section,
                  content,
                  word_count: result.word_count,
                  estimated_pages: result.estimated_pages,
                  status: getSectionStatus(result.word_count),
                  last_updated: new Date().toISOString()
                }
              : section
          );

          return {
            ...currentState,
            sections: updatedSections,
            lastSaved: new Date(),
            saving: false
          };
        });

        // Refresh progress
        await refreshProgress();
        resolve();
      } catch (error) {
        proposalStore.update(currentState => ({
          ...currentState,
          error: error instanceof Error ? error.message : 'Failed to update section',
          saving: false
        }));
        resolve();
      }
    })();
  });
}

async function refreshProgress(): Promise<void> {
  return new Promise((resolve) => {
    proposalStore.subscribe(async (state) => {
      if (!state.proposal) {
        resolve();
        return;
      }

      try {
        const progress = await proposalService.getProposalProgress(state.proposal.proposal_id);
        if (progress) {
          proposalStore.update(currentState => ({ ...currentState, progress }));
        }
        resolve();
      } catch (error) {
        console.error('Error refreshing progress:', error);
        resolve();
      }
    })();
  });
}

function setActiveSection(sectionId: string): void {
  proposalStore.update(state => ({ ...state, activeSection: sectionId }));
}

function setError(error: string | null): void {
  proposalStore.update(state => ({ ...state, error }));
}

function clearError(): void {
  proposalStore.update(state => ({ ...state, error: null }));
}

function getSection(sectionId: string): ProposalSection | null {
  let result: ProposalSection | null = null;
  proposalStore.subscribe(state => { 
    result = state.sections.find(s => s.section_id === sectionId) || null;
  })();
  return result;
}

function getSectionsByCategory(category: string): ProposalSection[] {
  let result: ProposalSection[] = [];
  proposalStore.subscribe(state => { 
    result = state.sections.filter(s => s.section_id.startsWith(`${category}.`));
  })();
  return result;
}

function reset(): void {
  proposalStore.set({
    proposal: null,
    sections: [],
    progress: null,
    activeSection: 'excellence.objectives',
    loading: false,
    error: null,
    saving: false,
    lastSaved: null
  });
}

// Export the store and all functions
export {
  proposalStore,
  loadProposal,
  updateSection,
  refreshProgress,
  setActiveSection,
  setError,
  clearError,
  getSection,
  getSectionsByCategory,
  reset
};

// Export type for use in components
export type ProposalStoreType = typeof proposalStore;