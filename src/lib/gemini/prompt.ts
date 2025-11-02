/**
 * Gemini Prompt Builder - Creates system prompts with context
 */

import { Document, Message } from '../parsers/types';

/**
 * Build system prompt for document editing agent
 */
export function buildSystemPrompt(document?: Document): string {
  const basePrompt = `You are an intelligent document editing assistant with the ability to search, read, and edit documents. Your goal is to help users edit their documents efficiently and accurately.

## Available Tools

You have access to these tools:

1. **doc_search(query)** - Search for lines containing specific keywords
   - Returns up to 5 most relevant lines with line numbers
   - Use this when you need to find specific content

2. **doc_read(lines)** - Read specific lines by their line numbers
   - Takes an array of line numbers: [5, 10, 15]
   - Returns the exact content of those lines

3. **doc_edit(operation, lines, newText)** - Edit document lines
   - Operations: 'replace', 'insert', 'delete'
   - IMPORTANT: Cannot edit locked lines
   - Always verify line numbers before editing

## Citation Syntax

Users can reference specific parts of the document using:
- @line10 or @l10 - Reference line 10
- @l5-10 - Reference lines 5 through 10
- @page3 or @p3 - Reference all lines on page 3

When users use citations, the referenced content will be automatically included in the context.

## Guidelines

1. **Always verify before editing** - Use doc_read to check content before making changes
2. **Respect locked lines** - Never attempt to edit locked lines
3. **Be precise** - Use exact line numbers when editing
4. **Confirm changes** - Tell users what you changed
5. **Handle errors gracefully** - If a tool fails, explain why and suggest alternatives

## Best Practices

- Use doc_search to find content when you don't know the line numbers
- Use doc_read to verify content before editing
- For large edits, process in smaller batches
- Always explain what changes you're making`;

  if (document) {
    const metadata = `

## Current Document

- Format: ${document.metadata.format.toUpperCase()}
- Total Lines: ${document.metadata.totalLines}
- Total Pages: ${document.metadata.totalPages}
- File: ${document.metadata.fileName || 'Untitled'}`;

    return basePrompt + metadata;
  }

  return basePrompt;
}

/**
 * Build prompt with citation context
 */
export function buildPromptWithContext(
  userMessage: string,
  citationContext?: string,
  document?: Document
): string {
  let prompt = '';

  // Add document context if available
  if (document) {
    prompt += `Document: ${document.metadata.fileName || 'Untitled'} (${document.metadata.totalLines} lines, ${document.metadata.totalPages} pages)\n\n`;
  }

  // Add citation context if present
  if (citationContext) {
    prompt += citationContext + '\n\n';
  }

  // Add user message
  prompt += `User request: ${userMessage}`;

  return prompt;
}

/**
 * Build conversation history for Gemini
 */
export function buildConversationHistory(
  messages: Message[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  try {
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    console.info(`[PROMPT_BUILDER] Built conversation history with ${history.length} messages`);

    return history;

  } catch (error) {
    console.error('[PROMPT_BUILDER] Error building conversation history:', error);
    return [];
  }
}

/**
 * Format tool result as text for context
 */
export function formatToolResult(
  toolName: string,
  result: any
): string {
  try {
    switch (toolName) {
      case 'doc_search':
        if (Array.isArray(result) && result.length > 0) {
          const formatted = result
            .map((r: any) => `Line ${r.lineNumber}: ${r.text}`)
            .join('\n');
          return `Search results:\n${formatted}`;
        }
        return 'No results found';

      case 'doc_read':
        if (result.success && result.lines) {
          const formatted = result.lines
            .map((l: any) => `Line ${l.lineNumber}: ${l.text}`)
            .join('\n');
          return `Lines read:\n${formatted}`;
        }
        return `Error: ${result.error || 'Could not read lines'}`;

      case 'doc_edit':
        if (result.success) {
          return `Successfully edited lines: ${result.modifiedLines.join(', ')}`;
        }
        return `Edit failed: ${result.error || 'Unknown error'}`;

      default:
        return JSON.stringify(result);
    }

  } catch (error) {
    console.error('[PROMPT_BUILDER] Error formatting tool result:', error);
    return 'Error formatting result';
  }
}

/**
 * Build error message
 */
export function buildErrorMessage(error: Error | string): string {
  const message = error instanceof Error ? error.message : error;

  return `I encountered an error: ${message}. Please try again or rephrase your request.`;
}

/**
 * Build success message for edit operations
 */
export function buildEditSuccessMessage(
  operation: string,
  lineNumbers: number[]
): string {
  const lines = lineNumbers.length === 1 ? 'line' : 'lines';

  switch (operation) {
    case 'replace':
      return `Successfully replaced ${lines} ${lineNumbers.join(', ')}`;

    case 'insert':
      return `Successfully inserted new content after ${lines} ${lineNumbers.join(', ')}`;

    case 'delete':
      return `Successfully deleted ${lines} ${lineNumbers.join(', ')}`;

    default:
      return `Successfully performed ${operation} on ${lines} ${lineNumbers.join(', ')}`;
  }
}
