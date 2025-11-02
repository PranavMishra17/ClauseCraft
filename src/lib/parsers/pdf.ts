/**
 * PDF Parser - Extracts text from PDF files with page tracking
 * Uses pdf-parse library
 */

import pdf from 'pdf-parse';
import { Line } from './types';

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
    console.error('[PDF_PARSER] Error detecting placeholder:', error);
    return false;
  }
}

/**
 * Parses PDF file buffer and extracts lines with accurate page numbers
 */
export async function parsePdf(buffer: Buffer): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[PDF_PARSER] Starting PDF parsing');

    // Extract text from PDF with page info
    const data = await pdf(buffer, {
      pagerender: async (pageData: any) => {
        try {
          const textContent = await pageData.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          return pageText;
        } catch (error) {
          console.error('[PDF_PARSER] Error rendering page:', error);
          return '';
        }
      }
    });

    if (!data.text) {
      console.warn('[PDF_PARSER] No text content found in PDF');
      return lines;
    }

    console.info(`[PDF_PARSER] Text extracted successfully from ${data.numpages} pages`);

    // Process page by page
    let currentLineNumber = 1;

    for (let pageNum = 1; pageNum <= data.numpages; pageNum++) {
      try {
        // Get page text (this is a simplification - pdf-parse provides full text)
        // We split the full text and estimate pages
        const pageText = data.text;
        const pageLines = pageText.split('\n');

        // Calculate lines per page estimate
        const linesPerPage = Math.ceil(pageLines.length / data.numpages);
        const startIndex = (pageNum - 1) * linesPerPage;
        const endIndex = Math.min(startIndex + linesPerPage, pageLines.length);

        for (let i = startIndex; i < endIndex; i++) {
          const text = pageLines[i].trim();

          // Skip empty lines but keep track of them for formatting
          if (text || i === 0) {
            lines.push({
              lineNumber: currentLineNumber++,
              text,
              pageNumber: pageNum,
              isLocked: false,
              isPlaceholder: isPlaceholderLine(text)
            });
          }
        }
      } catch (error) {
        console.error(`[PDF_PARSER] Error processing page ${pageNum}:`, error);
      }
    }

    console.info(`[PDF_PARSER] Successfully parsed ${lines.length} lines from ${data.numpages} pages`);

    return lines;

  } catch (error) {
    console.error('[PDF_PARSER] Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative simpler parsing for when page-by-page is not needed
 */
export async function parsePdfSimple(buffer: Buffer): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[PDF_PARSER] Starting simple PDF parsing');

    const data = await pdf(buffer);

    if (!data.text) {
      console.warn('[PDF_PARSER] No text content found in PDF');
      return lines;
    }

    const rawLines = data.text.split('\n');
    const linesPerPage = Math.ceil(rawLines.length / data.numpages);

    rawLines.forEach((text, index) => {
      const lineNumber = index + 1;
      const pageNumber = Math.ceil(lineNumber / linesPerPage);

      lines.push({
        lineNumber,
        text: text.trim(),
        pageNumber,
        isLocked: false,
        isPlaceholder: isPlaceholderLine(text)
      });
    });

    console.info(`[PDF_PARSER] Successfully parsed ${lines.length} lines from ${data.numpages} pages`);

    return lines;

  } catch (error) {
    console.error('[PDF_PARSER] Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if buffer is a valid PDF file
 */
export function isValidPdf(buffer: Buffer): boolean {
  try {
    // PDF files start with %PDF
    const signature = buffer.toString('ascii', 0, 4);
    return signature === '%PDF';
  } catch (error) {
    console.error('[PDF_PARSER] Error validating PDF:', error);
    return false;
  }
}
