import * as React from 'react'
import { cn } from '@/src/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }