import React from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import { 
  InfoIcon, 
  TrendingDownIcon, 
  TrendingUpIcon, 
  CircleDotIcon, 
  ChevronRightIcon,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";

// Improved sparkline component
const Sparklines = ({ data, color, height = 20 }: { data: number[], color: string, height?: number }) => {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  // Avoid division by zero
  const getY = (value: number) => {
    if (range === 0) return height / 2; // Default to middle if all values are the same
    return height - ((value - min) / range) * height;
  };
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = getY(value);
    return `${x},${y}`;
  }).join(" ");

  // Add a fill gradient
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Filled area under the line */}
      <path
        d={`M0,${height} L0,${getY(data[0])} ${points} L100,${height} Z`}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line itself */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Last point highlight dot */}
      <circle
        cx="100"
        cy={getY(data[data.length - 1])}
        r="2"
        fill={color}
      />
    </svg>
  );
};

export type KPICardProps = {
  title: string;
  value: string | number;
  delta?: number;
  description?: string;
  trend?: number[];
  prefix?: string;
  suffix?: string;
  className?: string;
  tooltipContent?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  valueSize?: "sm" | "md" | "lg" | "xl";
  colorScheme?: "default" | "success" | "warning" | "error" | "info";
  actionText?: string;
  actionUrl?: string;
  onClick?: () => void;
};

export function KPICard({
  title,
  value,
  delta,
  description,
  trend,
  prefix,
  suffix,
  className,
  tooltipContent,
  isLoading = false,
  size = "md",
  valueSize = "lg",
  colorScheme = "default",
  actionText,
  actionUrl,
  onClick,
}: KPICardProps) {
  const getColorClass = () => {
    switch (colorScheme) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-foreground';
    }
  };

  // Determine color scheme based on delta and provided colorScheme
  const getColorScheme = () => {
    switch (colorScheme) {
      case "success":
        return {
          text: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          sparkline: "rgba(16, 185, 129, 0.8)",
          stateRing: "ring-emerald-500/30"
        };
      case "warning":
        return {
          text: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/30",
          sparkline: "rgba(245, 158, 11, 0.8)",
          stateRing: "ring-amber-500/30"
        };
      case "error":
        return {
          text: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-50 dark:bg-rose-950/30",
          sparkline: "rgba(225, 29, 72, 0.8)",
          stateRing: "ring-rose-500/30"
        };
      case "info":
        return {
          text: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          sparkline: "rgba(59, 130, 246, 0.8)",
          stateRing: "ring-blue-500/30"
        };
      default:
        return {
          text: delta && delta > 0 
            ? "text-emerald-600 dark:text-emerald-400" 
            : delta && delta < 0 
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-600 dark:text-slate-400",
          bg: delta && delta > 0 
            ? "bg-emerald-50 dark:bg-emerald-950/30" 
            : delta && delta < 0 
              ? "bg-rose-50 dark:bg-rose-950/30"
              : "bg-slate-50 dark:bg-slate-800/30",
          sparkline: delta && delta > 0
            ? "rgba(16, 185, 129, 0.8)"
            : delta && delta < 0
              ? "rgba(225, 29, 72, 0.8)"
              : "rgba(100, 116, 139, 0.8)",
          stateRing: delta && delta > 0
            ? "ring-emerald-500/30"
            : delta && delta < 0
              ? "ring-rose-500/30"
              : "ring-slate-500/30"
        };
    }
  };

  const colors = getColorScheme();
  
  // Different size variants
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };
  
  const valueSizeClasses = {
    sm: "text-lg font-medium",
    md: "text-2xl font-medium",
    lg: "text-3xl font-semibold",
    xl: "text-4xl font-bold",
  };

  if (isLoading) {
    return (
      <Card 
        className={cn(
          "overflow-hidden", 
          className,
          "hover:border-primary/20 transition-all"
        )}
        hover
      >
        <CardContent className={sizeClasses[size]}>
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-5 w-16" />
        </CardContent>
      </Card>
    );
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden", 
        className,
        (onClick || actionUrl) && "cursor-pointer hover:border-primary/20 transition-all duration-200", 
      )}
      hover
      onClick={handleClick}
    >
      <CardContent className={cn(sizeClasses[size], "relative")}>
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            {title}
            {tooltipContent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help ml-1" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tooltipContent}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h3>
          
          {delta !== undefined && (
            <Badge variant="outline" className={cn(
              "font-medium text-xs ml-auto", 
              colors.text, 
              colors.bg, 
              "ring-1", 
              colors.stateRing
            )}>
              {delta > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : delta < 0 ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <CircleDotIcon className="h-3 w-3 mr-1" />
              )}
              {delta > 0 ? "+" : ""}{delta}%
            </Badge>
          )}
        </div>
        
        <div className="flex items-baseline gap-1 mb-2">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <span className={cn(valueSizeClasses[valueSize], "leading-none tracking-tight")}>
            {value}
          </span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        
        {trend && trend.length > 0 && (
          <div className="my-2">
            <Sparklines data={trend} color={colors.sparkline} height={24} />
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
          
          {actionText && (
            <span className="text-xs font-medium text-primary flex items-center gap-0.5 ml-auto">
              {actionText}
              <ChevronRightIcon className="h-3 w-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 