import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChartRenderer } from '../components/ChartRenderer';
import { SavedQuery } from '../components/ResultsPanel';

interface DashboardPageProps {
  onReRunQuery: (saved: SavedQuery) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onReRunQuery }) => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('queryspeak_saved_queries');
    if (raw) {
      try {
        setSavedQueries(JSON.parse(raw));
      } catch (err) {
        console.error('Failed to parse saved queries:', err);
      }
    }
  }, []);

  const handleDeleteSaved = (id: string) => {
    const updated = savedQueries.filter((q) => q.id !== id);
    setSavedQueries(updated);
    localStorage.setItem('queryspeak_saved_queries', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            Saved Query Dashboard
          </h2>
          <p className="text-sm text-muted">
            Pin and monitor natural language query widgets and visual reports.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accentTeal/15 text-accentTeal border border-accentTeal/30">
          {savedQueries.length} Saved Widgets
        </span>
      </div>

      {savedQueries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <svg
            className="w-16 h-16 text-muted/40 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="font-display font-semibold text-lg text-ink mb-1">
            No Saved Queries Yet
          </h3>
          <p className="text-sm text-muted max-w-sm mb-4">
            Run a query in the Workspace and click "Save Query" to pin a visual widget card here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedQueries.map((item) => (
            <Card key={item.id} className="flex flex-col gap-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display font-bold text-base text-ink line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">
                    {item.query}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSaved(item.id)}
                  className="text-muted hover:text-error text-sm focus:outline-none"
                  title="Remove from Dashboard"
                >
                  &times;
                </button>
              </div>

              {/* Chart Preview Widget */}
              <div className="bg-background/40 p-2 rounded-xl border border-border/50">
                <ChartRenderer
                  columns={item.results.columns}
                  rows={item.results.rows}
                  height={160}
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  onClick={() => onReRunQuery(item)}
                >
                  Re-run in Workspace &rarr;
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
