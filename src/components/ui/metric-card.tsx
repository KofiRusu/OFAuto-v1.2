import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const metricCardVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:shadow-md hover:-translate-y-0.5",
        gradient: "bg-gradient-to-br hover:shadow-lg hover:-translate-y-0.5",
        outline: "border-2 hover:shadow-md hover:-translate-y-0.5",
        elevated: "shadow-md hover:shadow-lg hover:-translate-y-1",
      },
      trend: {
        positive: "",
        negative: "",
        neutral: "",
      },
    },
    defaultVariants: {
      variant: "default",
      trend: "neutral",
    },
    compoundVariants: [
      {
        variant: "gradient",
        trend: "positive",
        className: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800",
      },
      {
        variant: "gradient",
        trend: "negative",
        className: "from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800",
      },
      {
        variant: "gradient",
        trend: "neutral",
        className: "from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20",
      },
      {
        variant: "outline",
        trend: "positive",
        className: "border-emerald-200 dark:border-emerald-800",
      },
      {
        variant: "outline",
        trend: "negative",
        className: "border-rose-200 dark:border-rose-800",
      },
    ],
  }
);

const trendIconVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      trend: {
        positive: "text-emerald-600 dark:text-emerald-400",
        negative: "text-rose-600 dark:text-rose-400",
        neutral: "text-gray-600 dark:text-gray-400",
      },
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      trend: "neutral",
      size: "md",
    },
  }
);

const trendBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      trend: {
        positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        negative: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        neutral: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
      },
    },
    defaultVariants: {
      trend: "neutral",
    },
  }
);

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    type?: 'positive' | 'negative' | 'neutral';
  };
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  sparkline?: number[];
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className,
    variant,
    title,
    value,
    description,
    icon: Icon,
    trend,
    loading = false,
    prefix,
    suffix,
    sparkline,
    badge,
    ...props 
  }, ref) => {
    const TrendIcon = trend?.type === 'positive' ? TrendingUp : 
                     trend?.type === 'negative' ? TrendingDown : Minus;
    
    const trendType = trend?.type || 'neutral';
    
    // Generate sparkline SVG if data provided
    const sparklineSvg = React.useMemo(() => {
      if (!sparkline || sparkline.length < 2) return null;
      
      const max = Math.max(...sparkline);
      const min = Math.min(...sparkline);
      const range = max - min || 1;
      const points = sparkline.map((val, i) => {
        const x = (i / (sparkline.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
      }).join(' ');
      
      return (
        <svg 
          className="absolute bottom-0 left-0 w-full h-12 opacity-10"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );
    }, [sparkline]);

    return (
      <Card
        ref={ref}
        className={cn(
          metricCardVariants({ variant, trend: trendType }),
          className
        )}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              title
            )}
          </CardTitle>
          {Icon && !loading && (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )}
          {badge && !loading && (
            <span className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              badge.variant === 'secondary' && "bg-secondary text-secondary-foreground",
              badge.variant === 'destructive' && "bg-destructive text-destructive-foreground",
              badge.variant === 'outline' && "border border-input",
              !badge.variant && "bg-primary text-primary-foreground"
            )}>
              {badge.label}
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {prefix}{value}{suffix}
                </span>
                {trend && (
                  <span className={trendBadgeVariants({ trend: trendType })}>
                    <TrendIcon className={trendIconVariants({ trend: trendType, size: 'sm' })} />
                    {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
            )}
            {description && !loading && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {sparklineSvg}
        </CardContent>
        
        {/* Decorative elements */}
        {variant === 'elevated' && (
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 dark:bg-primary/10" />
        )}
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';

export { MetricCard, metricCardVariants };