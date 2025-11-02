/**
 * Markdown Parser - Extracts lines from Markdown files
 * Simple line-by-line parsing with header detection
 */

import { marked } from 'marked';
import { Line } from './types';

const LINES_PER_PAGE = 50; // Configurable estimate for markdown
const PLACEHOLDER_PATTERNS = [
  /\{\{.*?\}\}/g,           // {{PLACEHOLDER}}
  /\[([A-Z_]+)\]/g,         // [CONSTANT_NAME]
  /_{5,}/g                   // _____
];

/**
 * Detects if a line contains placeholder text
 */
function isPlaceholderLine(text: string): boolean {
  try {
    return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
  } catch (error) {
    console.error('[MD_PARSER] Error detecting placeholder:', error);
    return false;
  }
}

/**
 * Extracts metadata from markdown content (title, headers)
 */
function extractMetadata(content: string): { title?: string; headers: string[] } {
  const headers: string[] = [];
  let title: string | undefined;

  try {
    const lines = content.split('\n');

    for (const line of lines) {
      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const headerText = headerMatch[2].trim();
        headers.push(headerText);

        // Use first H1 as title if not set
        if (!title && headerMatch[1] === '#') {
          title = headerText;
        }
      }
    }
  } catch (error) {
    console.error('[MD_PARSER] Error extracting metadata:', error);
  }

  return { title, headers };
}

/**
 * Parses Markdown content and extracts lines
 */
export async function parseMarkdown(content: string): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[MD_PARSER] Starting Markdown parsing');

    if (!content || content.trim().length === 0) {
      console.warn('[MD_PARSER] No content found in Markdown file');
      return lines;
    }

    // Extract metadata for logging
    const metadata = extractMetadata(content);
    if (metadata.title) {
      console.info(`[MD_PARSER] Document title: ${metadata.title}`);
    }
    if (metadata.headers.length > 0) {
      console.info(`[MD_PARSER] Found ${metadata.headers.length} headers`);
    }

    // Split into lines
    const rawLines = content.split('\n');

    rawLines.forEach((text, index) => {
      const lineNumber = index + 1;
      const pageNumber = Math.ceil(lineNumber / LINES_PER_PAGE);

      lines.push({
        lineNumber,
        text: text, // Keep original formatting including whitespace
        pageNumber,
        isLocked: false,
        isPlaceholder: isPlaceholderLine(text)
      });
    });

    console.info(`[MD_PARSER] Successfully parsed ${lines.length} lines from ${Math.ceil(lines.length / LINES_PER_PAGE)} estimated pages`);

    return lines;

  } catch (error) {
    console.error('[MD_PARSER] Error parsing Markdown:', error);
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses Markdown from Buffer
 */
export async function parseMarkdownBuffer(buffer: Buffer): Promise<Line[]> {
  try {
    const content = buffer.toString('utf-8');
    return await parseMarkdown(content);
  } catch (error) {
    console.error('[MD_PARSER] Error parsing Markdown buffer:', error);
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if content is valid Markdown
 */
export function isValidMarkdown(content: string): boolean {
  try {
    // Basic validation - check if it's valid text
    // Markdown is quite permissive, so we just check for common patterns
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Try to parse with marked to validate
    marked.parse(content);
    return true;
  } catch (error) {
    console.error('[MD_PARSER] Error validating Markdown:', error);
    return false;
  }
}

/**
 * Converts parsed lines back to Markdown
 */
export function linesToMarkdown(lines: Line[]): string {
  try {
    return lines.map(line => line.text).join('\n');
  } catch (error) {
    console.error('[MD_PARSER] Error converting lines to Markdown:', error);
    throw new Error(`Failed to convert lines to Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
