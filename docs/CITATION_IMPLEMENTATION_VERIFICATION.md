# Citation Implementation Verification Plan

This document outlines the verification plan for the structured citation integration in the personal chat experience.

## Verification Scope

The verification covers:
1. Data layer persistence of citation metadata
2. Propagation of citations through the streaming pipeline
3. Rendering of citation markers and popovers in the UI
4. Behavior on both streaming and persisted messages
5. Responsive design and accessibility
6. Edge cases and error handling

## Manual Test Cases

### TC1: Database Schema and Persistence
**Objective:** Verify that citation metadata is correctly stored and retrieved from the database.

**Steps:**
1. Run the database migration to add the `citations` column to the `message` table
2. Send a message to an AI that returns citations
3. Check the database to verify the citations column contains the expected JSON data
4. Retrieve the message via the API and confirm the citation data is included

**Expected Results:**
- The `citations` column is present in the `message` table
- Citation data is stored as valid JSON
- API responses include citation data for messages with citations

### TC2: Streaming Messages with Citations
**Objective:** Verify that citations are correctly handled during streaming responses.

**Steps:**
1. Send a message that will trigger a streaming AI response with citations
2. Observe the streaming response as it comes in
3. Check that citation markers appear in the correct positions in the text
4. Verify that the complete "Sources" section appears after streaming completes
5. Click on citation markers to verify popovers display correctly

**Expected Results:**
- Citation markers appear as blue numbered badges in the text
- The Sources section appears only after streaming is complete
- Clicking a citation marker shows a popover with source details
- Popovers include title, snippet (if available), URL (if available), and metadata

### TC3: Persisted Messages with Citations
**Objective:** Verify that citations are correctly displayed for previously sent messages.

**Steps:**
1. Navigate to a conversation that contains previous AI messages with citations
2. Verify that citation markers are displayed in the correct positions
3. Check that the "Sources" section is displayed below the message
4. Click on citation markers to verify popovers display correctly

**Expected Results:**
- Citation markers appear as blue numbered badges in the text
- The Sources section is displayed below the message
- Clicking a citation marker shows a popover with source details
- Popovers include title, snippet (if available), URL (if available), and metadata

### TC4: Responsive Design
**Objective:** Verify that citations display correctly on different screen sizes.

**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x812)
4. Verify popovers position correctly on all screen sizes
5. Check that the Sources section is readable on all screen sizes

**Expected Results:**
- Citation markers are appropriately sized on all devices
- Popovers are fully visible and don't cut off screen edges
- The Sources section adapts to smaller screens
- All interactive elements are usable on touch devices

### TC5: Accessibility
**Objective:** Verify that the citation features are accessible to all users.

**Steps:**
1. Test keyboard navigation through citation markers
2. Verify screen reader announcements for citation markers
3. Check that popovers can be opened and closed with keyboard
4. Verify color contrast meets WCAG standards
5. Test with high contrast mode

**Expected Results:**
- Citation markers are focusable with keyboard
- Screen readers announce citation markers as "View citation N"
- Popovers can be opened with Enter/Space and closed with Escape
- Color contrast ratios are at least 4.5:1 for normal text
- All features work in high contrast mode

### TC6: Edge Cases and Error Handling
**Objective:** Verify that the citation system handles edge cases gracefully.

**Steps:**
1. Test with a message that has citation markers but no citation data
2. Test with citation data that includes very long titles
3. Test with citation data that includes missing or invalid URLs
4. Test with citation data that has missing metadata fields
5. Test with a message that has more than 10 citations

**Expected Results:**
- Missing citation data doesn't break the message display
- Long titles are truncated appropriately
- Invalid URLs are handled gracefully or not displayed
- Missing metadata fields don't cause errors
- Large numbers of citations are displayed correctly

## Automated Tests

### Unit Tests

#### citationRenderer.test.ts
```typescript
import { renderTextWithCitations, extractCitationIds, validateCitations } from '$lib/utils/citationRenderer';
import type { Citation } from '$lib/types/schema';

describe('citationRenderer', () => {
  const mockCitations: Citation[] = [
    { id: '1', title: 'Source 1' },
    { id: '2', title: 'Source 2' }
  ];

  test('renderTextWithCitations should replace citation markers with components', () => {
    const text = 'This is a reference [1] and another one [2]';
    const segments = renderTextWithCitations(text, mockCitations, CitationPopover);
    
    expect(segments).toHaveLength(5); // text, citation, text, citation, text
    expect(segments[1].type).toBe('citation');
    expect(segments[1].content).toEqual(mockCitations[0]);
  });

  test('extractCitationIds should extract all citation IDs from text', () => {
    const text = 'References [1], [2], and [3]';
    const ids = extractCitationIds(text);
    
    expect(ids).toEqual(['1', '2', '3']);
  });

  test('validateCitations should identify missing and extra citations', () => {
    const text = 'References [1] and [3]';
    const result = validateCitations(text, mockCitations);
    
    expect(result.isValid).toBe(false);
    expect(result.missingIds).toContain('3');
    expect(result.extraIds).toContain('2');
  });
});
```

### Integration Tests

#### API Tests
```typescript
import { POST, GET } from '$lib/server/api/messages/+server.ts';

describe('/api/messages', () => {
  test('POST should store citations with message', async () => {
    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 1,
        text: 'Response with citations [1]',
        sender: 'ai',
        citations: [{ id: '1', title: 'Source 1' }]
      })
    });

    const response = await POST({ request, cookies: {} });
    const data = await response.json();
    
    expect(data.message.citations).toEqual([{ id: '1', title: 'Source 1' }]);
  });

  test('GET should return citations with messages', async () => {
    const request = new Request('http://localhost/api/messages?conversationId=1');
    const response = await GET({ request, cookies: {} });
    const data = await response.json();
    
    expect(data.messages[0].citations).toBeDefined();
  });
});
```

## Performance Tests

1. **Message Loading Time**: Verify that loading messages with 10+ citations doesn't exceed 200ms
2. **Popover Opening Time**: Verify that citation popovers open within 50ms of clicking
3. **Memory Usage**: Verify that citation rendering doesn't cause excessive memory usage

## Regression Tests

1. Verify that non-AI messages (user, system) are not affected by citation changes
2. Verify that messages without citations display unchanged
3. Verify that existing AI metadata (provider, model, etc.) still displays correctly
4. Verify that follow-up suggestions still work with messages containing citations
5. Verify that copying a message copies the text without citation HTML markup

## Browser Compatibility

Test the citation features in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Verification Checklist

- [ ] Database migration runs successfully
- [ ] Citation data persists correctly
- [ ] Streaming messages display citations after completion
- [ ] Persisted messages display citations correctly
- [ ] Citation popovers show correct information
- [ ] Popover positioning works on all screen sizes
- [ ] Keyboard navigation works properly
- [ ] Screen readers announce citations appropriately
- [ ] Color contrast meets accessibility standards
- [ ] Edge cases are handled gracefully
- [ ] Performance benchmarks are met
- [ ] Regression tests pass
- [ ] Browser compatibility is confirmed