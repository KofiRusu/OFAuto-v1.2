import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  X, 
  Upload, 
  Calendar, 
  MessageSquare, 
  Users,
  type LucideIcon 
} from 'lucide-react';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
  description?: string;
}

export interface QuickActionProps {
  items: QuickActionItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  trigger?: {
    icon?: LucideIcon;
    label?: string;
  };
}

const QuickAction: React.FC<QuickActionProps> = ({
  items,
  position = 'bottom-right',
  trigger = { icon: Plus },
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const TriggerIcon = trigger.icon || Plus;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const menuPositionClasses = {
    'bottom-right': 'bottom-20 right-0',
    'bottom-left': 'bottom-20 left-0',
    'top-right': 'top-20 right-0',
    'top-left': 'top-20 left-0',
  };

  const animationClasses = {
    'bottom-right': 'origin-bottom-right',
    'bottom-left': 'origin-bottom-left',
    'top-right': 'origin-top-right',
    'top-left': 'origin-top-left',
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Container */}
      <div className={cn("fixed z-50", positionClasses[position])}>
        {/* Action items */}
        <div
          className={cn(
            "absolute flex flex-col gap-3 transition-all duration-200",
            menuPositionClasses[position],
            animationClasses[position],
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          )}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 transition-all duration-200",
                position.includes('right') ? 'flex-row-reverse' : 'flex-row',
                isOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              <button
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
                  "hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2",
                  item.color || "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
                  "focus:ring-primary"
                )}
              >
                <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                
                {/* Tooltip */}
                <div
                  className={cn(
                    "absolute whitespace-nowrap rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-1.5 text-xs text-white",
                    "opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200",
                    "shadow-lg",
                    position.includes('right') 
                      ? 'right-full mr-3' 
                      : 'left-full ml-3'
                  )}
                >
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="mt-0.5 text-gray-300">{item.description}</div>
                  )}
                  {/* Arrow */}
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-0 w-0 border-y-4 border-y-transparent",
                      position.includes('right')
                        ? "-right-2 border-l-4 border-l-gray-900 dark:border-l-gray-700"
                        : "-left-2 border-r-4 border-r-gray-900 dark:border-r-gray-700"
                    )}
                  />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Trigger button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "relative h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "hover:shadow-xl hover:scale-110",
            isOpen && "rotate-45 bg-destructive hover:bg-destructive/90"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <TriggerIcon className="h-6 w-6" />
              {trigger.label && (
                <span className="sr-only">{trigger.label}</span>
              )}
              {/* Pulse animation for attention */}
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            </>
          )}
        </Button>
      </div>
    </>
  );
};

// Pre-configured quick action sets
export const defaultQuickActions: QuickActionItem[] = [
  {
    id: 'create-post',
    label: 'Create Post',
    icon: Upload,
    description: 'Upload new content',
    onClick: () => console.log('Create post'),
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    description: 'Plan your content',
    onClick: () => console.log('Open scheduler'),
    color: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    description: 'Check messages',
    onClick: () => console.log('Open messages'),
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    id: 'add-client',
    label: 'Add Client',
    icon: Users,
    description: 'New client',
    onClick: () => console.log('Add client'),
    color: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
];

export { QuickAction };