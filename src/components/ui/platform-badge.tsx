import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Platform icons (you would import actual icons here)
const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  // This is a placeholder - in production you'd use actual platform icons
  const icons: Record<string, React.ReactNode> = {
    onlyfans: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12">OF</text>
      </svg>
    ),
    fansly: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12">F</text>
      </svg>
    ),
    kofi: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12">K</text>
      </svg>
    ),
    patreon: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12">P</text>
      </svg>
    ),
    instagram: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" fill="white" />
        <circle cx="18" cy="6" r="1.5" fill="white" />
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
      </svg>
    ),
    tiktok: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12a3 3 0 103 3V2h4a4 4 0 004 4v4a8 8 0 01-4-1v6a7 7 0 11-7-7z" />
      </svg>
    ),
  };

  return icons[platform.toLowerCase()] || (
    <div className={cn("rounded-full bg-current", className)} />
  );
};

const platformBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-opacity-20 text-opacity-90 hover:bg-opacity-30",
        solid: "text-white hover:opacity-90",
        outline: "border-2 bg-transparent hover:bg-opacity-10",
        ghost: "bg-transparent hover:bg-opacity-10",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      platform: {
        onlyfans: "",
        fansly: "",
        kofi: "",
        patreon: "",
        instagram: "",
        twitter: "",
        tiktok: "",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      platform: "default",
    },
    compoundVariants: [
      // OnlyFans variants
      {
        platform: "onlyfans",
        variant: "default",
        className: "bg-[#00AFF0] text-[#00AFF0]",
      },
      {
        platform: "onlyfans",
        variant: "solid",
        className: "bg-[#00AFF0]",
      },
      {
        platform: "onlyfans",
        variant: "outline",
        className: "border-[#00AFF0] text-[#00AFF0]",
      },
      // Fansly variants
      {
        platform: "fansly",
        variant: "default",
        className: "bg-[#1DA1F2] text-[#1DA1F2]",
      },
      {
        platform: "fansly",
        variant: "solid",
        className: "bg-[#1DA1F2]",
      },
      {
        platform: "fansly",
        variant: "outline",
        className: "border-[#1DA1F2] text-[#1DA1F2]",
      },
      // Ko-fi variants
      {
        platform: "kofi",
        variant: "default",
        className: "bg-[#FF5E5B] text-[#FF5E5B]",
      },
      {
        platform: "kofi",
        variant: "solid",
        className: "bg-[#FF5E5B]",
      },
      {
        platform: "kofi",
        variant: "outline",
        className: "border-[#FF5E5B] text-[#FF5E5B]",
      },
      // Patreon variants
      {
        platform: "patreon",
        variant: "default",
        className: "bg-[#FF424D] text-[#FF424D]",
      },
      {
        platform: "patreon",
        variant: "solid",
        className: "bg-[#FF424D]",
      },
      {
        platform: "patreon",
        variant: "outline",
        className: "border-[#FF424D] text-[#FF424D]",
      },
      // Instagram variants
      {
        platform: "instagram",
        variant: "default",
        className: "bg-gradient-to-r from-purple-500 to-pink-500 text-purple-600",
      },
      {
        platform: "instagram",
        variant: "solid",
        className: "bg-gradient-to-r from-purple-500 to-pink-500",
      },
      {
        platform: "instagram",
        variant: "outline",
        className: "border-purple-500 text-purple-600",
      },
      // Twitter variants
      {
        platform: "twitter",
        variant: "default",
        className: "bg-[#1DA1F2] text-[#1DA1F2]",
      },
      {
        platform: "twitter",
        variant: "solid",
        className: "bg-[#1DA1F2]",
      },
      {
        platform: "twitter",
        variant: "outline",
        className: "border-[#1DA1F2] text-[#1DA1F2]",
      },
      // TikTok variants
      {
        platform: "tiktok",
        variant: "default",
        className: "bg-black text-black dark:bg-white dark:text-white",
      },
      {
        platform: "tiktok",
        variant: "solid",
        className: "bg-black dark:bg-white dark:text-black",
      },
      {
        platform: "tiktok",
        variant: "outline",
        className: "border-black text-black dark:border-white dark:text-white",
      },
    ],
  }
);

export interface PlatformBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof platformBadgeVariants> {
  platform: string;
  showIcon?: boolean;
  count?: number;
  status?: 'connected' | 'disconnected' | 'pending';
}

const PlatformBadge = React.forwardRef<HTMLSpanElement, PlatformBadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    platform = 'default',
    showIcon = true, 
    count,
    status,
    children,
    ...props 
  }, ref) => {
    const iconSizeMap = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };
    
    const iconSize = iconSizeMap[size as keyof typeof iconSizeMap] || iconSizeMap.md;

    const statusIndicator = status && (
      <span
        className={cn(
          "inline-block rounded-full",
          size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2',
          status === 'connected' && 'bg-green-500',
          status === 'disconnected' && 'bg-red-500',
          status === 'pending' && 'bg-yellow-500 animate-pulse'
        )}
      />
    );

    return (
      <span
        ref={ref}
        className={cn(
          platformBadgeVariants({ 
            variant, 
            size, 
            platform: platform.toLowerCase() as any 
          }),
          className
        )}
        {...props}
      >
        {showIcon && <PlatformIcon platform={platform} className={iconSize} />}
        <span className="capitalize">
          {children || platform}
        </span>
        {count !== undefined && (
          <span className="ml-1 opacity-75">({count})</span>
        )}
        {statusIndicator}
      </span>
    );
  }
);

PlatformBadge.displayName = 'PlatformBadge';

export { PlatformBadge, platformBadgeVariants };