'use client';

/**
 * DocumentViewer Component - Displays document with line numbers
 */

import { useState } from 'react';
import { Document, Line } from '@/lib/parsers/types';
import LineItem from './LineItem';
import { FileText, Download } from 'lucide-react';

interface DocumentViewerProps {
  document: Document | null;
  onLineToggleLock?: (line: Line) => void;
  onExport?: (format: 'docx' | 'pdf' | 'markdown') => void;
}

export default function DocumentViewer({
  document,
  onLineToggleLock,
  onExport
}: DocumentViewerProps) {
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

  const handleLineSelect = (line: Line) => {
    setSelectedLine(line.lineNumber === selectedLine?.lineNumber ? null : line);
  };

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Document Loaded</h3>
        <p className="text-sm text-gray-500 text-center">
          Upload a document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {document.metadata.fileName || 'Untitled'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {document.metadata.totalLines} lines • {document.metadata.totalPages} pages • {document.metadata.format.toUpperCase()}
            </p>
          </div>

          {/* Export Button */}
          {onExport && (
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                title="Export document"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => onExport('docx')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as DOCX
                </button>
                <button
                  onClick={() => onExport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => onExport('markdown')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as Markdown
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Lines */}
      <div className="flex-1 overflow-y-auto">
        {document.lines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Document is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {document.lines.map((line) => (
              <LineItem
                key={line.lineNumber}
                line={line}
                isSelected={selectedLine?.lineNumber === line.lineNumber}
                onSelect={handleLineSelect}
                onToggleLock={onLineToggleLock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {document.lines.filter(l => l.isLocked).length} locked lines
          </span>
          <span>
            {document.lines.filter(l => l.isPlaceholder).length} placeholders
          </span>
          {selectedLine && (
            <span className="text-blue-600">
              Line {selectedLine.lineNumber} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
