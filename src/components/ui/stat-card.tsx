import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/src/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

const statCardVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      trend: {
        up: 'border-green-200 dark:border-green-800',
        down: 'border-red-200 dark:border-red-800',
        neutral: '',
      },
    },
    defaultVariants: {
      trend: 'neutral',
    },
  }
)

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  suffix?: string
  prefix?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className, 
    title, 
    value, 
    description, 
    icon, 
    trend = 'neutral', 
    trendValue,
    suffix,
    prefix,
    ...props 
  }, ref) => {
    return (
      <Card ref={ref} className={cn(statCardVariants({ trend }), className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </div>
          {(description || trendValue) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {trendValue && (
                <span className={cn(
                  'font-medium',
                  trend === 'up' && 'text-green-600 dark:text-green-400',
                  trend === 'down' && 'text-red-600 dark:text-red-400'
                )}>
                  {trend === 'up' && '+'}
                  {trendValue}
                </span>
              )}
              {description}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = 'StatCard'

export { StatCard, statCardVariants }