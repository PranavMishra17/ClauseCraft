/**
 * PDF Export - Convert document lines to PDF format
 */

import { jsPDF } from 'jspdf';
import { Document, Line } from '../parsers/types';

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const LINE_HEIGHT = 7;
const MAX_WIDTH = PAGE_WIDTH - (MARGIN * 2);

/**
 * Export document to PDF format
 */
export function exportToPdf(document: Document): Blob {
  try {
    console.info('[PDF_EXPORT] Starting PDF export');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = MARGIN;
    let pageNumber = 1;

    // Set font
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Process each line
    document.lines.forEach((line, index) => {
      // Check if we need a new page
      if (y > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        y = MARGIN;
        pageNumber++;
      }

      // Handle long lines (wrap text)
      const text = line.text || ' ';
      const lines = doc.splitTextToSize(text, MAX_WIDTH);

      // Add each split line
      lines.forEach((textLine: string) => {
        if (y > PAGE_HEIGHT - MARGIN) {
          doc.addPage();
          y = MARGIN;
          pageNumber++;
        }

        doc.text(textLine, MARGIN, y);
        y += LINE_HEIGHT;
      });
    });

    // Add page numbers
    const totalPages = pageNumber;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages}`,
        PAGE_WIDTH / 2,
        PAGE_HEIGHT - 10,
        { align: 'center' }
      );
    }

    // Generate blob
    const blob = doc.output('blob');

    console.info(`[PDF_EXPORT] Successfully exported ${document.lines.length} lines to PDF (${totalPages} pages)`);

    return blob;

  } catch (error) {
    console.error('[PDF_EXPORT] Error exporting to PDF:', error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download PDF file
 */
export function downloadPdf(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[PDF_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[PDF_EXPORT] Error downloading PDF:', error);
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
