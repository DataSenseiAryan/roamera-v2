import * as React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onPress?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', style, onClick, onPress, hoverable = false }: CardProps) {
  const handleClick = onClick ?? onPress;
  const base = 'bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-4';
  const hoverStyle = hoverable ? 'cursor-pointer hover:shadow-card-hover transition-shadow duration-150' : '';

  return (
    <div
      className={`${base} ${hoverStyle} ${className}`}
      style={style}
      onClick={handleClick}
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : undefined}
      onKeyDown={handleClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>;
}
