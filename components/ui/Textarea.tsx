'use client';

import { forwardRef } from 'react';

const baseClasses =
  'w-full px-4 py-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-strava/50 focus:border-strava focus:bg-white/80 dark:focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px]';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${baseClasses} ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''} ${className}`}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

export default Textarea;
