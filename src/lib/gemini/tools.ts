/**
 * Gemini Tools - Function definitions for document operations
 */

import { Document, SearchResult, Line, EditParams, EditResult } from '../parsers/types';

/**
 * Tool definitions for Gemini function calling
 */
export const toolDefinitions = {
  functionDeclarations: [
    {
      name: 'doc_search',
      description: 'Search the document for lines containing specific keywords or phrases. Returns up to 5 most relevant lines with their line numbers.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or keyword to find in the document'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5, max: 20)',
            default: 5
          }
        },
        required: ['query']
      }
    },
    {
      name: 'doc_read',
      description: 'Read specific lines from the document by their line numbers. Use this to get the exact content of lines.',
      parameters: {
        type: 'object',
        properties: {
          lines: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of line numbers to read (e.g., [5, 10, 15])'
          }
        },
        required: ['lines']
      }
    },
    {
      name: 'doc_edit',
      description: 'Edit lines in the document. Supports replace, insert, and delete operations. IMPORTANT: Cannot edit locked lines.',
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['replace', 'insert', 'delete'],
            description: 'The edit operation to perform'
          },
          lines: {
            type: 'array',
            items: { type: 'number' },
            description: 'Line numbers to edit'
          },
          newText: {
            type: 'string',
            description: 'New text content (required for replace and insert operations)'
          }
        },
        required: ['operation', 'lines']
      }
    }
  ]
};

/**
 * Execute doc_search tool
 */
export function executeDocSearch(
  query: string,
  document: Document,
  limit: number = 5
): SearchResult[] {
  try {
    console.info(`[TOOLS] Executing doc_search: "${query}"`);

    if (!query || query.trim().length === 0) {
      console.warn('[TOOLS] Empty search query');
      return [];
    }

    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search through all lines
    for (const line of document.lines) {
      if (line.text.toLowerCase().includes(queryLower)) {
        // Simple scoring based on exact match vs partial
        const exactMatch = line.text.toLowerCase() === queryLower;
        const score = exactMatch ? 1.0 : 0.5;

        results.push({
          lineNumber: line.lineNumber,
          text: line.text,
          score
        });
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, Math.min(limit, 20));

    console.info(`[TOOLS] Found ${results.length} results, returning top ${limitedResults.length}`);

    return limitedResults;

  } catch (error) {
    console.error('[TOOLS] Error in doc_search:', error);
    return [];
  }
}

/**
 * Execute doc_read tool
 */
export function executeDocRead(
  lineNumbers: number[],
  document: Document
): { success: boolean; lines: Line[]; error?: string } {
  try {
    console.info(`[TOOLS] Executing doc_read for lines: ${lineNumbers.join(', ')}`);

    if (!lineNumbers || lineNumbers.length === 0) {
      return {
        success: false,
        lines: [],
        error: 'No line numbers provided'
      };
    }

    const lines: Line[] = [];

    for (const lineNum of lineNumbers) {
      const line = document.lines.find(l => l.lineNumber === lineNum);

      if (line) {
        lines.push(line);
      } else {
        console.warn(`[TOOLS] Line ${lineNum} not found`);
      }
    }

    console.info(`[TOOLS] Read ${lines.length}/${lineNumbers.length} lines successfully`);

    return {
      success: true,
      lines
    };

  } catch (error) {
    console.error('[TOOLS] Error in doc_read:', error);
    return {
      success: false,
      lines: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute doc_edit tool
 */
export function executeDocEdit(
  params: EditParams,
  document: Document
): EditResult {
  try {
    console.info(`[TOOLS] Executing doc_edit: ${params.operation} on lines ${params.lines.join(', ')}`);

    // Validate parameters
    if (!params.lines || params.lines.length === 0) {
      return {
        success: false,
        modifiedLines: [],
        error: 'No line numbers provided'
      };
    }

    if ((params.operation === 'replace' || params.operation === 'insert') && !params.newText) {
      return {
        success: false,
        modifiedLines: [],
        error: `New text is required for ${params.operation} operation`
      };
    }

    // Check if any lines are locked
    const lockedLines = params.lines.filter(lineNum => {
      const line = document.lines.find(l => l.lineNumber === lineNum);
      return line?.isLocked;
    });

    if (lockedLines.length > 0) {
      console.warn(`[TOOLS] Cannot edit locked lines: ${lockedLines.join(', ')}`);
      return {
        success: false,
        modifiedLines: [],
        error: `Cannot edit locked lines: ${lockedLines.join(', ')}`
      };
    }

    // Perform the edit operation
    const modifiedLines: number[] = [];

    switch (params.operation) {
      case 'replace': {
        for (const lineNum of params.lines) {
          const lineIndex = document.lines.findIndex(l => l.lineNumber === lineNum);

          if (lineIndex !== -1) {
            document.lines[lineIndex].text = params.newText || '';
            modifiedLines.push(lineNum);
            console.info(`[TOOLS] Replaced line ${lineNum}`);
          }
        }
        break;
      }

      case 'delete': {
        // Filter out lines to delete
        const linesToDelete = new Set(params.lines);
        document.lines = document.lines.filter(line => {
          if (linesToDelete.has(line.lineNumber)) {
            modifiedLines.push(line.lineNumber);
            console.info(`[TOOLS] Deleted line ${line.lineNumber}`);
            return false;
          }
          return true;
        });

        // Renumber remaining lines
        document.lines.forEach((line, index) => {
          line.lineNumber = index + 1;
        });
        break;
      }

      case 'insert': {
        // Insert new lines
        for (const lineNum of params.lines) {
          const lineIndex = document.lines.findIndex(l => l.lineNumber === lineNum);

          if (lineIndex !== -1) {
            const newLine: Line = {
              lineNumber: lineNum + 0.5, // Temporary number for sorting
              text: params.newText || '',
              pageNumber: document.lines[lineIndex].pageNumber,
              isLocked: false,
              isPlaceholder: false
            };

            document.lines.splice(lineIndex + 1, 0, newLine);
            modifiedLines.push(lineNum);
            console.info(`[TOOLS] Inserted line after ${lineNum}`);
          }
        }

        // Renumber all lines
        document.lines.forEach((line, index) => {
          line.lineNumber = index + 1;
        });
        break;
      }

      default:
        return {
          success: false,
          modifiedLines: [],
          error: `Unknown operation: ${params.operation}`
        };
    }

    // Update document metadata
    document.metadata.totalLines = document.lines.length;

    console.info(`[TOOLS] Successfully modified ${modifiedLines.length} lines`);

    return {
      success: true,
      modifiedLines
    };

  } catch (error) {
    console.error('[TOOLS] Error in doc_edit:', error);
    return {
      success: false,
      modifiedLines: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
