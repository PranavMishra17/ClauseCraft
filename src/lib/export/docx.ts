/**
 * DOCX Export - Convert document lines to DOCX format
 */

import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { Document, Line } from '../parsers/types';

/**
 * Export document to DOCX format
 */
export async function exportToDocx(document: Document): Promise<Blob> {
  try {
    console.info('[DOCX_EXPORT] Starting DOCX export');

    // Create paragraphs from lines
    const paragraphs = document.lines.map(line =>
      new Paragraph({
        children: [
          new TextRun({
            text: line.text || ' ', // Empty lines need at least a space
            break: 0
          })
        ],
        spacing: {
          after: 100 // Small spacing between lines
        }
      })
    );

    // Create document
    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720
              }
            }
          },
          children: paragraphs
        }
      ]
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);

    console.info(`[DOCX_EXPORT] Successfully exported ${document.lines.length} lines to DOCX`);

    return blob;

  } catch (error) {
    console.error('[DOCX_EXPORT] Error exporting to DOCX:', error);
    throw new Error(`Failed to export DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download DOCX file
 */
export function downloadDocx(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[DOCX_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[DOCX_EXPORT] Error downloading DOCX:', error);
    throw new Error(`Failed to download DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
