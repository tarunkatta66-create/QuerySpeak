import React from 'react';
import { Card } from './ui/Card';

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  sql: string;
  results: {
    columns: string[];
    rows: Array<Record<string, unknown>>;
  };
}

interface HistoryRailProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelectItem: (item: HistoryItem) => void;
}

export const HistoryRail: React.FC<HistoryRailProps> = ({
  items,
  selectedId,
  onSelectItem,
}) => {
  return (
    <Card className="flex flex-col gap-4 h-full min-h-[500px]">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-display font-bold text-lg text-ink">History</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-border/50 text-muted">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-4">
          <svg
            className="w-10 h-10 text-muted/40 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-muted leading-relaxed max-w-[180px]">
            No recent queries. Start speaking to explore data.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-1">
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal ${
                  isSelected
                    ? 'border-accentTeal bg-accentTeal/5 shadow-sm'
                    : 'border-border/60 bg-surface/50 hover:bg-surface hover:border-border'
                }`}
              >
                <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">
                  {item.query}
                </p>
                <span className="text-[11px] text-muted mt-1.5 block">
                  {item.timestamp}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
};
