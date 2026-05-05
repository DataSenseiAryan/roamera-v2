import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, wrapperClassName = '', className = '', ...props }, ref) => {
    const base =
      'w-full rounded-2xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
    const borderClass = error
      ? 'border-red-400 dark:border-red-500'
      : 'border-slate-200 dark:border-slate-700';
    const paddingLeft = leftIcon ? 'pl-10' : '';
    const paddingRight = rightIcon ? 'pr-10' : '';

    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`${base} ${borderClass} ${paddingLeft} ${paddingRight} ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
