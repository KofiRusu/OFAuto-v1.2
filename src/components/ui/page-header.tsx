import * as React from 'react'
import { cn } from '@/src/lib/utils'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, breadcrumb, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {breadcrumb && (
          <div className="flex items-center text-sm text-muted-foreground">
            {breadcrumb}
          </div>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

export interface PageHeaderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const PageHeaderTitle = React.forwardRef<HTMLHeadingElement, PageHeaderTitleProps>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn('text-3xl font-bold tracking-tight', className)}
      {...props}
    />
  )
)
PageHeaderTitle.displayName = 'PageHeaderTitle'

export interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const PageHeaderDescription = React.forwardRef<HTMLParagraphElement, PageHeaderDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  )
)
PageHeaderDescription.displayName = 'PageHeaderDescription'

export { PageHeader, PageHeaderTitle, PageHeaderDescription }