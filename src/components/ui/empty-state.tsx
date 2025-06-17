import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  FileX, 
  Inbox, 
  Search, 
  Users, 
  Calendar,
  MessageSquare,
  BarChart,
  Settings,
  type LucideIcon 
} from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  illustration?: 'default' | 'search' | 'error' | 'success' | 'custom';
  customIllustration?: React.ReactNode;
}

// Preset empty state configurations
export const emptyStatePresets = {
  noData: {
    icon: FileX,
    title: 'No data yet',
    description: 'Get started by creating your first item.',
  },
  noResults: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  noClients: {
    icon: Users,
    title: 'No clients yet',
    description: 'Start growing your audience by adding your first client.',
  },
  noScheduled: {
    icon: Calendar,
    title: 'No scheduled content',
    description: 'Plan ahead by scheduling your posts in advance.',
  },
  noMessages: {
    icon: MessageSquare,
    title: 'No messages',
    description: 'Your inbox is empty. Messages will appear here.',
  },
  noAnalytics: {
    icon: BarChart,
    title: 'No analytics data',
    description: 'Analytics will be available once you have some activity.',
  },
  configRequired: {
    icon: Settings,
    title: 'Configuration needed',
    description: 'Complete the setup to start using this feature.',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
  illustration = 'default',
  customIllustration,
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-3',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-4',
    },
  };

  const sizes = sizeClasses[size];

  // Default illustrations
  const illustrations = {
    default: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl" />
        <div className="relative bg-muted/50 rounded-full p-4">
          {React.isValidElement(icon) ? icon : icon && <icon className={sizes.icon} />}
        </div>
      </div>
    ),
    search: (
      <svg
        className={cn(sizes.icon, "text-muted-foreground")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="8" strokeWidth={2} />
        <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
        <path d="M11 8v6M8 11h6" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
    error: (
      <div className="relative">
        <div className="absolute inset-0 bg-destructive/20 blur-2xl" />
        <div className="relative bg-destructive/10 rounded-full p-4">
          <FileX className={cn(sizes.icon, "text-destructive")} />
        </div>
      </div>
    ),
    success: (
      <div className="relative">
        <div className="absolute inset-0 bg-success/20 blur-2xl" />
        <div className="relative bg-success/10 rounded-full p-4">
          <svg
            className={cn(sizes.icon, "text-success")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    ),
    custom: customIllustration,
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        sizes.spacing,
        className
      )}
    >
      {/* Illustration or Icon */}
      <div className="relative">
        {illustrations[illustration] || (
          React.isValidElement(icon) ? (
            icon
          ) : (
            icon && <icon className={cn(sizes.icon, "text-muted-foreground")} />
          )
        )}
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold", sizes.title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn("text-muted-foreground max-w-sm", sizes.description)}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Animated empty state variant
export const AnimatedEmptyState: React.FC<EmptyStateProps> = (props) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <EmptyState {...props} />
    </div>
  );
};

export { EmptyState };