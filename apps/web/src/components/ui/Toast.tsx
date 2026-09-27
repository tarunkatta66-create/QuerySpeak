import React from 'react';

interface ToastProps {
  variant?: 'success' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'success',
  title,
  message,
  onClose,
  className = '',
}) => {
  const isSuccess = variant === 'success';

  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl border shadow-lg bg-surface ${
        isSuccess ? 'border-success/40' : 'border-error/40'
      } ${className}`}
    >
      <div className="flex gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
            isSuccess ? 'bg-success' : 'bg-error'
          }`}
        />
        <div>
          <h4 className="font-semibold text-sm text-ink">{title}</h4>
          {message && <p className="text-xs text-muted mt-0.5">{message}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted hover:text-ink transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal rounded"
        >
          &times;
        </button>
      )}
    </div>
  );
};
