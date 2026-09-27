import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyle =
    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accentTeal focus-visible:ring-offset-2';

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle =
      'bg-gradient-to-r from-accentCoral to-accentTeal text-white shadow-sm hover:opacity-95 active:scale-95';
  } else if (variant === 'secondary') {
    variantStyle =
      'border border-border bg-surface text-ink hover:bg-background active:scale-95';
  } else if (variant === 'ghost') {
    variantStyle =
      'bg-transparent text-ink hover:bg-border/30 active:scale-95';
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};
