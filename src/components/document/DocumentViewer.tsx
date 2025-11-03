'use client';

/**
 * DocumentViewer Component - Displays document with line numbers and preview mode
 */

import { useState } from 'react';
import { Document, Line } from '@/lib/parsers/types';
import LineItem from './LineItem';
import { FileText, Download, Eye, Edit3 } from 'lucide-react';

interface DocumentViewerProps {
  document: Document | null;
  onLineToggleLock?: (line: Line) => void;
  onExport?: (format: 'docx' | 'pdf' | 'markdown') => void;
  onRunLLMDetection?: () => void;
  isRunningLLMDetection?: boolean;
}

export default function DocumentViewer({
  document,
  onLineToggleLock,
  onExport,
  onRunLLMDetection,
  isRunningLLMDetection = false
}: DocumentViewerProps) {
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleLineSelect = (line: Line) => {
    setSelectedLine(line.lineNumber === selectedLine?.lineNumber ? null : line);
  };

  // Group lines by page for preview mode
  const groupLinesByPage = () => {
    const pages: { [key: number]: Line[] } = {};
    document?.lines.forEach(line => {
      if (!pages[line.pageNumber]) {
        pages[line.pageNumber] = [];
      }
      pages[line.pageNumber].push(line);
    });
    return pages;
  };

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <FileText className="w-20 h-20 text-gray-300 mb-6 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Document Loaded</h3>
          <p className="text-base text-gray-700 mb-6">
            Upload a document using the button in the top-right corner to get started
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-800">
              <strong className="text-gray-900">Supported formats:</strong> DOCX, PDF, Markdown
            </p>
          </div>
        </div>
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
            <p className="text-xs text-gray-600 mt-1">
              {document.metadata.totalLines} lines • {document.metadata.totalPages} pages • {document.metadata.format.toUpperCase()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Preview Toggle */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                isPreviewMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isPreviewMode ? 'Exit preview mode' : 'Preview document'}
            >
              {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>

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
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => onExport('markdown')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as Markdown
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto">
        {document.lines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Document is empty</p>
          </div>
        ) : isPreviewMode ? (
          /* Preview Mode - Show as pages */
          <div className="p-8 bg-gray-100 space-y-8">
            {Object.entries(groupLinesByPage()).map(([pageNum, lines]) => (
              <div
                key={pageNum}
                className="bg-white shadow-lg mx-auto max-w-4xl p-12 min-h-[11in] relative"
                style={{ width: '8.5in' }}
              >
                {/* Page Number */}
                <div className="absolute top-4 right-4 text-xs text-gray-400">
                  Page {pageNum}
                </div>

                {/* Page Content */}
                <div className="space-y-2">
                  {lines.map(line => {
                    // Build style object based on formatting
                    const style: React.CSSProperties = {
                      color: line.formatting?.color || '#1a1a1a',
                      textAlign: line.formatting?.alignment || 'left',
                      fontSize: line.formatting?.fontSize ? `${line.formatting.fontSize}px` : '14px',
                      fontFamily: line.formatting?.fontFamily || 'inherit',
                      fontWeight: line.formatting?.bold ? 'bold' : 'normal',
                      fontStyle: line.formatting?.italic ? 'italic' : 'normal',
                      textDecoration: line.formatting?.underline ? 'underline' : 'none',
                      backgroundColor: line.formatting?.backgroundColor || 'transparent'
                    };

                    return (
                      <p
                        key={line.lineNumber}
                        className={`leading-relaxed ${
                          line.isPlaceholder
                            ? 'bg-yellow-100 px-2 py-1 rounded'
                            : ''
                        } ${
                          line.isLocked
                            ? 'bg-red-50 px-1 border-l-2 border-red-400'
                            : ''
                        }`}
                        style={style}
                      >
                        {line.text || '\u00A0'}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Edit Mode - Show with line numbers */
          <div className="divide-y divide-gray-200">
            {document.lines.map((line, index) => {
              // Check if this is the first line of a new page
              const isNewPage = index > 0 && line.pageNumber !== document.lines[index - 1].pageNumber;

              return (
                <div key={line.lineNumber}>
                  {isNewPage && (
                    <div className="bg-gray-200 border-y-2 border-gray-400 px-4 py-2 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        — Page {line.pageNumber} —
                      </span>
                    </div>
                  )}
                  <LineItem
                    line={line}
                    isSelected={selectedLine?.lineNumber === line.lineNumber}
                    onSelect={handleLineSelect}
                    onToggleLock={onLineToggleLock}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!isPreviewMode && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center gap-4">
              <span>
                {document.lines.filter(l => l.isLocked).length} locked lines
              </span>
              <span>
                {document.lines.filter(l => l.isPlaceholder).length} placeholders
              </span>
            </div>

            <div className="flex items-center gap-4">
              {selectedLine && (
                <span className="text-blue-600 font-medium">
                  Line {selectedLine.lineNumber} selected
                </span>
              )}

              {/* LLM Detection Button */}
              {onRunLLMDetection && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Not satisfied?</span>
                  <button
                    onClick={onRunLLMDetection}
                    disabled={isRunningLLMDetection}
                    className="text-purple-600 hover:text-purple-700 font-medium underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {isRunningLLMDetection ? 'Running LLM detection...' : 'Run LLM-powered placeholder detection'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
