> Documentation status: archived | Owner: MAP-IT frontend/backend teams | Scope: historical proposal editor handoff | Last verified: 18-08-2026 for archival classification

# Proposal Editor UI/UX and Backend Integration Report

This report details the current implementation of the `/proposals` section and the proposal editing functionality, designed to aid the backend team in developing a new solution for integrating enhanced proposal writing capabilities.

## 1. Architecture Overview
The Proposal Editor is a modern, AI-driven application built with SvelteKit, leveraging Svelte 5 runes for state management and reactive components. It employs a client-server architecture where the frontend interacts with a REST API and utilizes Server-Sent Events (SSE) for real-time updates.

## 2. Route Structure
The primary entry point for editing a proposal is:
`src/routes/(protected)/dashboard/proposals/[proposal_id]/+page.svelte`

This page is responsible for:
*   Initializing the `proposalStore` with the specific proposal data.
*   Establishing a connection to the real-time SSE stream for live updates.
*   Rendering the `ProposalEditorLayout` component, which orchestrates the entire editing interface.

## 3. Current UI/UX (How it looks right now)

The user interface of the Proposal Editor is designed for an interactive, AI-assisted writing experience, focusing on a split-panel view that adapts to different screen sizes.

### **A. Responsive Layout (`proposal-editor-layout.svelte`)**
*   **Desktop View:** Presents a clear, dual-panel layout.
    *   **Left Panel (Chat Interface):** Occupies approximately two-fifths of the screen. This is where users interact with the AI assistant.
    *   **Right Panel (Document Viewer):** Occupies the remaining three-fifths, providing a live preview of the proposal document.
*   **Mobile View:** The layout transforms into a tabbed interface to optimize space.
    *   Users can switch between a "Chat" tab and a "Document" tab. The inactive tab is hidden.

### **B. Header**
*   A persistent header displays the "Proposal Editor" title, along with the proposal's `call_id`.
*   In mobile view, a tab switcher (`Chat` / `Document`) is present in the header.
*   Any error messages (e.g., from API calls) are displayed prominently in the header area.

### **C. Left Panel: AI Chat Interface**
This panel is primarily handled by `proposal-chat-interface.svelte` (though not explicitly detailed in this report, its function is clear from the layout).
*   **Quick Actions:** A dedicated section at the top of the chat panel provides "Quick Actions." These are pre-defined buttons (e.g., "Draft next section," "Improve current," "Make more specific," "Add examples," "Check compliance") that, when clicked, inject a specific prompt message directly into the chat input field, ready to be sent to the AI.
*   **Chat History:** Displays the ongoing conversation between the user and the AI.
*   **Input Field:** A text input area where users type their commands and questions for the AI. It's disabled when the AI is processing.

### **D. Right Panel: Document Viewer (`proposal-document-viewer.svelte`)**
This panel is focused on displaying the proposal content and its overall progress.
*   **Header:** Displays the proposal's title.
    *   **Save Status:** Shows "Saving..." animation and "Saved [X time ago]" timestamp, indicating real-time save feedback.
    *   **Overall Progress Bar:** A prominent progress bar displays the `completion_percentage` for the entire proposal, along with `completed_sections` out of `total_sections`, `total_words`, and `estimated_pages`.
*   **Left Sidebar (Navigation):**
    *   Organized into major categories (e.g., "Excellence," "Impact," "Implementation") as defined by `PROPOSAL_SECTIONS` in `src/lib/types/proposal.ts`.
    *   Each category has its own completion progress bar.
    *   Subsections within each category are listed as clickable navigation items.
    *   Each subsection (`SectionNavItem`) displays its `status` (empty, draft, complete) and allows users to jump to that section in the main content area.
*   **Main Content Area (Read-Only Section Display):**
    *   Displays the content of the currently active section.
    *   **Section Header:** Includes the section name (e.g., "Objectives").
    *   **Section Metadata:** Shows "Quality Score" (rated as High, Medium, Low, or Not rated), "Word Count," and "Status" (empty, draft, complete) for the currently viewed section.
    *   **Content:** The actual text content of the section, rendered as HTML within a visually distinct block. If a section has no content, a placeholder message prompts the user to use the chat interface to start writing it.
    *   **Current Limitation:** The document viewer is primarily a *viewer*. There is no direct inline rich-text editor for modifying the content manually. All content generation and modification are intended to be driven through the AI chat interface.

## 4. State Management (`proposalStore.ts`)
The `proposalStore` (a Svelte writable store) centralizes the proposal's state:
*   `proposal`: Contains the full `Proposal` object, including metadata and a flat array of `ProposalSection` objects.
*   `sections`: A list of all sections, each with its `section_id`, `section_name`, `content`, `word_count`, `estimated_pages`, `last_updated`, `quality_score`, and `status`.
*   `activeSection`: The `section_id` of the section currently displayed in the document viewer.
*   `progress`: An object containing aggregate statistics for the entire proposal (`total_sections`, `completed_sections`, `completion_percentage`, `total_words`, `estimated_pages`, `average_quality`).
*   `loading`, `saving`, `error`, `lastSaved`: Flags and timestamps for UI feedback.

**Key Actions provided by the store:**
*   `loadProposal(proposalId)`: Fetches the initial proposal data.
*   `updateSection(sectionId, content)`: Sends updated content for a specific section to the backend and updates the local store.
*   `refreshProgress()`: Fetches the latest progress statistics from the backend.
*   `setActiveSection(sectionId)`: Changes the currently viewed section.

## 5. Data Models & API (`proposalService.ts` and `proposal.ts`)

The `proposalService` class interacts with the backend API to manage proposal data. The core data structures are defined in `src/lib/types/proposal.ts`.

### **A. Core Data Structures**

*   **`Proposal`**: Represents the entire proposal document.
    ```typescript
    interface Proposal {
      proposal_id: number;
      call_id: string;
      proposal_title: string;
      proposal_acronym: string;
      proposal_type: string;
      status: 'draft' | 'in_review' | 'submitted' | 'approved' | 'rejected';
      created_at: string;
      updated_at: string;
      sections: ProposalSection[]; // A flat array of all sections
      progress: ProposalProgress;   // Overall progress statistics
    }
    ```
*   **`ProposalSection`**: Represents a single section within the proposal.
    ```typescript
    interface ProposalSection {
      section_id: string;      // e.g., 'excellence.objectives'
      section_name: string;
      content: string;         // The HTML content of the section
      word_count: number;
      estimated_pages: number;
      last_updated: string;
      quality_score: number | null; // A numerical score (0-1) for content quality
      status: 'empty' | 'draft' | 'complete';
    }
    ```
*   **`ProposalProgress`**: Aggregated statistics for the entire proposal.
    ```typescript
    interface ProposalProgress {
      total_sections: number;
      completed_sections: number;
      completion_percentage: number;
      total_words: number;
      estimated_pages: number;
      average_quality: number | null;
    }
    ```
*   **`PROPOSAL_SECTIONS`**: A constant object (frontend-defined) that defines the hierarchical structure and names of all possible sections, used for navigation and categorization. The `section_id` in `ProposalSection` directly maps to this structure (e.g., `excellence.objectives`).

### **B. API Endpoints Currently Used**

The `proposalService` makes calls to the following backend endpoints (prefixed with `/api`):

*   **`GET /api/proposal-document/:proposalId`**: Fetches the complete `Proposal` document, including all its sections and progress information.
*   **`GET /api/proposal-document/:proposalId/section/:sectionId`**: Retrieves a single `ProposalSection` by its ID.
*   **`PUT /api/proposal-document/:proposalId/section/:sectionId`**: Updates the content of a specific section. This is the primary endpoint for writing and modifying content. It expects a `SectionUpdateRequest` with `content`.
*   **`GET /api/proposal-document/:proposalId/progress`**: Fetches only the `ProposalProgress` statistics for a given proposal.
*   **`POST /api/proposal/generate-template`**: Creates a new proposal template based on `call_id` and `user_id`.
*   **`POST /api/proposal-document`**: Creates a new proposal with initial metadata.
*   **`GET /api/proposal-document`**: Fetches a list of all proposals.
*   **`GET /api/proposal-document/:proposalId/events`**: Establishes an SSE connection for real-time updates. Events like `section_updated` and `progress_updated` are pushed from the server.
*   **`streamProposalEdit(...)`**: This function (using `streamingConversationClient`) interfaces with a streaming endpoint to facilitate AI-driven conversation and content generation for proposals.

## 6. Recommendations for Backend Integration & New Solution

When designing the new backend solution for enhanced proposal writing capabilities, consider the following:

1.  **Hybrid Editing Support:** The current UI is strongly "AI-first." The new solution should anticipate a hybrid editing model where users can both command the AI and directly edit content via a rich-text editor (e.g., Tiptap/ProseMirror). This implies the backend needs to handle content updates from both AI generation and direct user input, potentially with version control or diffing capabilities.
2.  **Granular Content Updates & Streaming:** The current `PUT` endpoint updates an entire section. For a more fluid, collaborative, and AI-driven experience (especially with real-time editing), the backend could expose APIs for more granular updates (e.g., paragraph-level, sentence-level) and support token-by-token streaming for AI output.
3.  **Dynamic Proposal Structure:** The `PROPOSAL_SECTIONS` object is currently hardcoded in the frontend. To support different proposal types or evolving requirements, the backend should ideally manage the proposal's structural schema (sections, subsections, their order, and potentially requirements/guidelines). This would allow the frontend to dynamically render the navigation and content areas based on a backend-provided schema.
4.  **AI Integration for Content Generation & Feedback:** The current `streamProposalEdit` function is key. The new backend should robustly support complex AI interactions, including:
    *   **Contextual Understanding:** Providing the AI with the full proposal context (current section, surrounding sections, overall goal).
    *   **Instruction Following:** Translating user prompts into specific content generation/modification tasks.
    *   **Quality Metrics:** The `quality_score` field is present; the backend should provide an API for evaluating and updating this score based on AI analysis or user feedback.
    *   **Citation/Reference Integration:** If new capabilities include citing sources, the backend needs to manage and integrate this data effectively into the generated text.
5.  **Robust Real-time Collaboration:** The SSE implementation is a good start. For advanced features, consider integrating a more sophisticated real-time collaboration framework (e.g., WebSockets with conflict resolution) if multiple users will be editing the same proposal simultaneously.
6.  **Version History and Undo/Redo:** As editing becomes more interactive, maintaining a granular version history of sections or even individual content blocks will be crucial for recovery and auditing.
7.  **Content Validation and Compliance:** The "Check compliance" quick action suggests a need for backend validation services that can analyze content against predefined requirements or guidelines.
