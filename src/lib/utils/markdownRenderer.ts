import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Safely renders markdown text to HTML with proper sanitization
 * @param text - The markdown text to render
 * @returns The sanitized HTML string
 */
export function renderMarkdown(text: string): string {
  try {
    // Configure marked options for better formatting
    marked.setOptions({
      gfm: true,
      breaks: true // Convert \n to <br>
    });

    // Clean up the raw markdown to avoid leading blank paragraphs
    // 1) remove any leading whitespace/newlines
    // 2) collapse 3+ consecutive newlines into two (one blank line)
    const cleaned = String(text || '')
      .replace(/^[\s\uFEFF\xA0]+/, '')
      .replace(/\n{3,}/g, '\n\n');

    // Parse markdown and sanitize HTML
    const parsed = marked.parse(cleaned) as string;
    let sanitized = DOMPurify.sanitize(parsed) as string;

    // Post-process to add target="_blank" to all links
    sanitized = sanitized.replace(
      /<a\s+href="([^"]*)"([^>]*)>/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
    );

    return sanitized;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return text;
  }
}

/**
 * Renders markdown with Tailwind CSS classes for dark theme
 * @param text - The markdown text to render
 * @returns The HTML string with Tailwind classes
 */
export function renderMarkdownWithStyles(text: string): string {
  const html = renderMarkdown(text);
  
  // Add Tailwind classes for dark theme styling
  return `<div class="prose prose-invert max-w-none">${html}</div>`;
}