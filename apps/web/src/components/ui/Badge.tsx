import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'error' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  let variantStyle = 'bg-border/50 text-ink';

  if (variant === 'success') {
    variantStyle = 'bg-success/15 text-success border border-success/30';
  } else if (variant === 'error') {
    variantStyle = 'bg-error/15 text-error border border-error/30';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyle} ${className}`}
    >
      {children}
    </span>
  );
};
