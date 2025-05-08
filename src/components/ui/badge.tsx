import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: 
          "border-transparent bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-900/40",
        warning:
          "border-transparent bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 hover:bg-warning-100 dark:hover:bg-warning-900/40",
        error:
          "border-transparent bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-900/40",
        info:
          "border-transparent bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400 hover:bg-info-100 dark:hover:bg-info-900/40",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      shape: {
        default: "rounded-full",
        square: "rounded-md"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  withDot?: boolean;
  dotColor?: string;
}

function Badge({
  className,
  variant,
  size,
  shape,
  withDot,
  dotColor,
  ...props
}: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, size, shape }), 
      withDot ? "pl-2 flex items-center gap-1.5" : "", 
      className)}
      {...props}
    >
      {withDot && (
        <span 
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full", 
            dotColor || (
              variant === "default" ? "bg-primary-foreground" : 
              variant === "success" ? "bg-success-500" : 
              variant === "warning" ? "bg-warning-500" : 
              variant === "error" ? "bg-error-500" : 
              variant === "info" ? "bg-info-500" : 
              "bg-foreground"
            )
          )} 
        />
      )}
      {props.children}
    </div>
  )
}

// Custom badge styles for dashboard
const badgeStyles = {
  "badge-success": "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400 border-success-200 dark:border-success-800",
  "badge-warning": "bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border-warning-200 dark:border-warning-800",
  "badge-error": "bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 border-error-200 dark:border-error-800",
  "badge-info": "bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400 border-info-200 dark:border-info-800",
}

export { Badge, badgeVariants, badgeStyles } 