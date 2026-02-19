'use client';

import { forwardRef } from 'react';

const baseClasses =
  'w-full px-4 py-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-strava/50 focus:border-strava focus:bg-white/80 dark:focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, ...props }, ref) => (
    <select
      ref={ref}
      className={`${baseClasses} ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''} ${className}`}
      {...props}
    />
  )
);

Select.displayName = 'Select';

export default Select;
