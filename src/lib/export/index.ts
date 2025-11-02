/**
 * Export Module - Main router for document exports
 */

import { Document, DocumentFormat } from '../parsers/types';
import { exportToDocx, downloadDocx } from './docx';
import { exportToPdf, downloadPdf } from './pdf';
import { exportToMarkdown, downloadMarkdown } from './markdown';

/**
 * Export document to specified format and trigger download
 */
export async function exportDocument(
  document: Document,
  format: DocumentFormat,
  fileName?: string
): Promise<void> {
  try {
    console.info(`[EXPORT] Exporting document to ${format.toUpperCase()}`);

    const baseFileName = fileName || document.metadata.fileName || 'document';

    let blob: Blob;

    switch (format) {
      case 'docx':
        blob = await exportToDocx(document);
        downloadDocx(blob, baseFileName);
        break;

      case 'pdf':
        blob = exportToPdf(document);
        downloadPdf(blob, baseFileName);
        break;

      case 'markdown':
        blob = exportToMarkdown(document);
        downloadMarkdown(blob, baseFileName);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    console.info(`[EXPORT] Successfully exported and downloaded ${format.toUpperCase()}`);

  } catch (error) {
    console.error(`[EXPORT] Error exporting to ${format}:`, error);
    throw new Error(`Failed to export document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get export format from file extension
 */
export function getExportFormat(fileName: string): DocumentFormat {
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'docx':
      return 'docx';
    case 'pdf':
      return 'pdf';
    case 'md':
    case 'markdown':
    case 'txt':
      return 'markdown';
    default:
      return 'markdown'; // Default to markdown
  }
}

/**
 * Validate export format
 */
export function isValidExportFormat(format: string): format is DocumentFormat {
  return ['docx', 'pdf', 'markdown'].includes(format);
}

// Re-export individual exporters
export { exportToDocx, downloadDocx } from './docx';
export { exportToPdf, downloadPdf } from './pdf';
export { exportToMarkdown, downloadMarkdown } from './markdown';
