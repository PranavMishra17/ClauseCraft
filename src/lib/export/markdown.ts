/**
 * Markdown Export - Convert document lines to Markdown format
 */

import { Document, Line } from '../parsers/types';

/**
 * Export document to Markdown format
 */
export function exportToMarkdown(document: Document): Blob {
  try {
    console.info('[MD_EXPORT] Starting Markdown export');

    // Simple join with newlines
    const markdown = document.lines
      .map(line => line.text)
      .join('\n');

    // Create blob
    const blob = new Blob([markdown], { type: 'text/markdown' });

    console.info(`[MD_EXPORT] Successfully exported ${document.lines.length} lines to Markdown`);

    return blob;

  } catch (error) {
    console.error('[MD_EXPORT] Error exporting to Markdown:', error);
    throw new Error(`Failed to export Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download Markdown file
 */
export function downloadMarkdown(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[MD_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[MD_EXPORT] Error downloading Markdown:', error);
    throw new Error(`Failed to download Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
