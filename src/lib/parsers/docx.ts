/**
 * DOCX Parser - Extracts text from DOCX files line by line
 * Uses mammoth library for parsing
 */

import mammoth from 'mammoth';
import { Line } from './types';

const LINES_PER_PAGE = 40; // Configurable estimate
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
    console.error('[DOCX_PARSER] Error detecting placeholder:', error);
    return false;
  }
}

/**
 * Parses DOCX file buffer and extracts lines
 */
export async function parseDocx(buffer: Buffer): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[DOCX_PARSER] Starting DOCX parsing');

    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });

    if (!result.value) {
      console.warn('[DOCX_PARSER] No text content found in DOCX');
      return lines;
    }

    console.info('[DOCX_PARSER] Text extracted successfully, processing lines');

    // Split into lines and process
    const rawLines = result.value.split('\n');

    rawLines.forEach((text, index) => {
      const lineNumber = index + 1;
      const pageNumber = Math.ceil(lineNumber / LINES_PER_PAGE);

      lines.push({
        lineNumber,
        text: text.trim(),
        pageNumber,
        isLocked: false,
        isPlaceholder: isPlaceholderLine(text)
      });
    });

    console.info(`[DOCX_PARSER] Successfully parsed ${lines.length} lines from ${Math.ceil(lines.length / LINES_PER_PAGE)} estimated pages`);

    // Log warnings if any
    if (result.messages && result.messages.length > 0) {
      console.warn('[DOCX_PARSER] Parsing warnings:', result.messages);
    }

    return lines;

  } catch (error) {
    console.error('[DOCX_PARSER] Error parsing DOCX:', error);
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if buffer is a valid DOCX file
 */
export function isValidDocx(buffer: Buffer): boolean {
  try {
    // DOCX files are ZIP archives, check for PK signature
    const signature = buffer.toString('hex', 0, 4);
    return signature === '504b0304'; // PK.. signature
  } catch (error) {
    console.error('[DOCX_PARSER] Error validating DOCX:', error);
    return false;
  }
}
