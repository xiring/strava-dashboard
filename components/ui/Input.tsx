'use client';

import { forwardRef } from 'react';

const baseClasses =
  'w-full px-4 py-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-strava/50 focus:border-strava focus:bg-white/80 dark:focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => (
    <input
      ref={ref}
      className={`${baseClasses} ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''} ${className}`}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export default Input;
