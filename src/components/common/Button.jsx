import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline, ghost
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50 border border-transparent shadow-sm',
    secondary: 'bg-surface-secondary text-text hover:bg-surface-secondary/80 focus:ring-surface-secondary/50 border border-border shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 border border-transparent shadow-sm',
    outline: 'bg-transparent text-text border border-border hover:bg-surface-secondary focus:ring-primary/50',
    ghost: 'bg-transparent text-text hover:bg-surface-secondary focus:ring-primary/50 border border-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const disabledStyles = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed active:scale-100' : 'cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthStyles} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
