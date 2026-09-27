import React from 'react';

interface SQLBlockProps {
  code: string;
  className?: string;
}

export const SQLBlock: React.FC<SQLBlockProps> = ({ code, className = '' }) => {
  // Custom light syntax highlighting matching Resonance palette
  const highlightSQL = (text: string) => {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'ON',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'AS',
      'AND',
      'OR',
      'IN',
      'IS',
      'NULL',
      'NOT',
    ];

    const parts = text.split(/(\s+|[(),;])/);
    return parts.map((part, index) => {
      const upper = part.toUpperCase();
      if (keywords.includes(upper)) {
        return (
          <span key={index} className="text-accentCoral font-semibold">
            {part}
          </span>
        );
      }
      if (/^'.*'$|^".*"$/.test(part)) {
        return (
          <span key={index} className="text-accentTeal">
            {part}
          </span>
        );
      }
      if (/^\d+$/.test(part)) {
        return (
          <span key={index} className="text-success">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`font-mono text-sm bg-surface border border-border rounded-xl p-4 overflow-x-auto shadow-inner text-ink ${className}`}
    >
      <pre className="whitespace-pre">{highlightSQL(code)}</pre>
    </div>
  );
};
