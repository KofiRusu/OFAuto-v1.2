"use client"

import * as React from "react"

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className = '', ...props }, ref) => {
    const percentage = value ? Math.min(Math.max(0, value), max) : 0;

    return (
      <div
        className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={percentage}
        {...props}
      >
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${(percentage / max) * 100}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress }; 