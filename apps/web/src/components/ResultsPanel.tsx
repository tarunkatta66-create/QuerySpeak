import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Toast } from './ui/Toast';
import { ChartRenderer } from './ChartRenderer';

export interface ResultsData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface SavedQuery {
  id: string;
  title: string;
  query: string;
  sql: string;
  results: ResultsData;
  savedAt: string;
}

interface ResultsPanelProps {
  data: ResultsData | null;
  queryTitle?: string;
  activeSQL?: string;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  data,
  queryTitle = 'Query Results',
  activeSQL = '',
}) => {
  const [showTable, setShowTable] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  if (!data || data.rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <svg
          className="w-12 h-12 text-muted/50 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h4 className="font-display font-semibold text-ink text-base mb-1">
          No Results Loaded
        </h4>
        <p className="text-xs text-muted max-w-[220px]">
          Run a natural language query or select an item from history to view results.
        </p>
      </Card>
    );
  }

  // Action Toolbar handlers
  const handleDownloadCSV = () => {
    const headers = data.columns.join(',');
    const rowLines = data.rows.map((row) =>
      data.columns.map((col) => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rowLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `queryspeak_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Downloaded CSV file successfully!');
  };

  const handleCopySQL = async () => {
    if (!activeSQL) return;
    try {
      await navigator.clipboard.writeText(activeSQL);
      setToastMessage('Copied SQL query to clipboard!');
    } catch {
      setToastMessage('Failed to copy SQL');
    }
  };

  const handleSaveQuery = () => {
    if (!saveTitle.trim()) return;

    const newSaved: SavedQuery = {
      id: String(Date.now()),
      title: saveTitle,
      query: queryTitle,
      sql: activeSQL,
      results: data,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const existing: SavedQuery[] = JSON.parse(
      localStorage.getItem('queryspeak_saved_queries') || '[]'
    );
    existing.unshift(newSaved);
    localStorage.setItem('queryspeak_saved_queries', JSON.stringify(existing));

    setIsSaveModalOpen(false);
    setSaveTitle('');
    setToastMessage(`Saved "${saveTitle}" to Dashboard!`);
  };

  return (
    <Card className="flex flex-col gap-4 h-full min-h-[500px] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 right-2 z-50">
          <Toast
            title={toastMessage}
            variant="success"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-ink truncate max-w-[180px]">
            {queryTitle}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accentTeal/15 text-accentTeal border border-accentTeal/30">
            {data.rows.length} rows
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" className="text-xs px-2.5 py-1" onClick={handleDownloadCSV}>
            📥 CSV
          </Button>
          <Button variant="secondary" className="text-xs px-2.5 py-1" onClick={handleCopySQL}>
            📋 Copy SQL
          </Button>
          <Button
            variant="primary"
            className="text-xs px-2.5 py-1"
            onClick={() => setIsSaveModalOpen(true)}
          >
            ⭐ Save Query
          </Button>
        </div>
      </div>

      {/* Auto Chart Renderer */}
      <div className="bg-background/40 p-3 rounded-xl border border-border/50">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Automated Visualization
        </div>
        <ChartRenderer columns={data.columns} rows={data.rows} height={200} />
      </div>

      {/* Collapsible Raw Data Table */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="flex items-center justify-between text-xs font-semibold text-muted hover:text-ink transition py-1"
        >
          <span>{showTable ? 'Hide Raw Data Table' : 'View Raw Data Table'}</span>
          <span>{showTable ? '▲' : '▼'}</span>
        </button>

        {showTable && (
          <div className="overflow-x-auto rounded-xl border border-border max-h-[300px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-border text-xs uppercase font-semibold text-muted sticky top-0">
                <tr>
                  {data.columns.map((col) => (
                    <th key={col} className="px-4 py-2.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-surface">
                {data.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-background/50 transition-colors duration-150"
                  >
                    {data.columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 text-ink font-medium text-xs">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-ink">Save Query</h3>
            <input
              type="text"
              placeholder="Query Title (e.g., Revenue Summary Q3)"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setIsSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveQuery}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
