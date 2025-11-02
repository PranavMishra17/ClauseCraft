'use client';

/**
 * LineItem Component - Displays a single line with line number and lock button
 */

import { Line } from '@/lib/parsers/types';
import { Lock, Unlock } from 'lucide-react';

interface LineItemProps {
  line: Line;
  isSelected?: boolean;
  onSelect?: (line: Line) => void;
  onToggleLock?: (line: Line) => void;
}

export default function LineItem({
  line,
  isSelected = false,
  onSelect,
  onToggleLock
}: LineItemProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(line);
    }
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(line);
    }
  };

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-300' : ''
      } ${line.isPlaceholder ? 'bg-yellow-50' : ''} ${
        line.isLocked ? 'bg-red-50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Line Number */}
      <div className="flex-shrink-0 w-12 text-right">
        <span className="text-xs text-gray-500 font-mono">{line.lineNumber}</span>
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono whitespace-pre-wrap break-words">
          {line.text || ' '}
        </p>
      </div>

      {/* Lock Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleLockClick}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={line.isLocked ? 'Unlock line' : 'Lock line'}
          aria-label={line.isLocked ? 'Unlock line' : 'Lock line'}
        >
          {line.isLocked ? (
            <Lock className="w-4 h-4 text-red-600" />
          ) : (
            <Unlock className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}
