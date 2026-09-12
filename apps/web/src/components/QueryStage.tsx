import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SQLBlock } from './ui/SQLBlock';
import { VoiceOrb, OrbStatus } from './VoiceOrb';
import { useTypewriter } from '../hooks/useTypewriter';

interface QueryStageProps {
  orbStatus: OrbStatus;
  onToggleOrbStatus: () => void;
  transcript: string;
  onTranscriptChange: (text: string) => void;
  sqlQuery: string;
  onRunQuery: (sql: string) => void;
}

export const QueryStage: React.FC<QueryStageProps> = ({
  orbStatus,
  onToggleOrbStatus,
  transcript,
  onTranscriptChange,
  sqlQuery,
  onRunQuery,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSQL, setEditedSQL] = useState(sqlQuery);

  const { displayedText: typedSQL } = useTypewriter(
    sqlQuery,
    orbStatus === 'done' && !isEditing
  );

  const handleEditClick = () => {
    setEditedSQL(sqlQuery);
    setIsEditing(true);
  };

  const handleRunEditedClick = () => {
    setIsEditing(false);
    onRunQuery(editedSQL);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Orb Card */}
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <VoiceOrb status={orbStatus} onClick={onToggleOrbStatus} />

        {/* Watermark / Helper Guidance Text */}
        {orbStatus === 'idle' && !transcript && (
          <p className="text-xs text-muted/80 mt-3 italic">
            Tap the orb and say <span className="font-medium text-accentCoral font-sans">"Show me the top 5 customers"</span>
          </p>
        )}
        {orbStatus !== 'idle' && (
          <p className="text-xs text-muted mt-3">
            Click Orb to cycle state ({orbStatus})
          </p>
        )}

        {/* Live Transcript Input */}
        <div className="w-full mt-4">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1 text-left">
            Live Transcript
          </label>
          <input
            type="text"
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Speak or type a natural language query..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-ink text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
          />
        </div>
      </Card>

      {/* SQL Output Card */}
      {orbStatus === 'done' && sqlQuery && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ink">
              Generated SQL
            </h3>
            <Badge variant="success">Schema confidence: High</Badge>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={editedSQL}
                onChange={(e) => setEditedSQL(e.target.value)}
                rows={5}
                className="w-full font-mono text-sm p-4 rounded-xl border border-border bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRunEditedClick}>
                  Run Edited Query
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <SQLBlock code={typedSQL} />
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={handleEditClick}>
                  Edit SQL
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onRunQuery(sqlQuery)}
                >
                  Run Again
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
