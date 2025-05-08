'use client';

import { useState, useEffect } from 'react';
import { InfoIcon, Sparkles, ArrowRight, X, HelpCircle, LightbulbIcon } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  TooltipArrow
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useGuidedTips } from '@/lib/ui/useGuidedTips';
import { cn } from '@/lib/utils';

interface GuidedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  tipId: string;
  location: Parameters<typeof useGuidedTips>[0]['location'];
  withIcon?: boolean;
  className?: string;
  delay?: number;
  forceShow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'info' | 'feature';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function GuidedTooltip({
  children,
  content,
  tipId,
  location,
  withIcon = false,
  className = '',
  delay = 0,
  forceShow = false,
  size = 'md',
  variant = 'default',
  side = 'top',
  align = 'center',
  action
}: GuidedTooltipProps) {
  const { checkTip, markTipAsShown } = useGuidedTips({ location, forceShow });
  const [showTooltip, setShowTooltip] = useState(false);
  const [open, setOpen] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  // Get the appropriate icon based on variant
  const getIcon = () => {
    switch(variant) {
      case 'info':
        return <InfoIcon size={14} />;
      case 'feature':
        return <Sparkles size={14} />;
      default:
        return <LightbulbIcon size={14} />;
    }
  };

  // Get the style based on variant
  const getVariantStyles = () => {
    switch(variant) {
      case 'info':
        return 'bg-blue-500';
      case 'feature':
        return 'bg-purple-500';
      default:
        return 'bg-primary';
    }
  };

  // Get the size for the tooltip content
  const getTooltipSize = () => {
    switch(size) {
      case 'sm':
        return 'max-w-[200px]';
      case 'lg':
        return 'max-w-[350px]';
      default:
        return 'max-w-[275px]';
    }
  };

  // Determine if this tip should be shown
  useEffect(() => {
    if (delay > 0) {
      // Show tooltip after delay
      const timer = setTimeout(() => {
        const shouldShow = checkTip(tipId);
        setShowTooltip(shouldShow);
        if (shouldShow) {
          setOpen(true);
          
          // Add highlight animation after a short delay
          setTimeout(() => {
            setShowHighlight(true);
          }, 300);
        }
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      const shouldShow = checkTip(tipId);
      setShowTooltip(shouldShow);
      if (shouldShow && forceShow) {
        setOpen(true);
        
        // Add highlight animation after a short delay
        setTimeout(() => {
          setShowHighlight(true);
        }, 300);
      }
    }
  }, [checkTip, tipId, delay, forceShow]);

  // Mark tooltip as shown when closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && showTooltip) {
      markTipAsShown(tipId);
      setShowTooltip(false);
      setShowHighlight(false);
    }
  };

  // A wrapper to handle the action click
  const handleAction = () => {
    if (action?.onClick) {
      action.onClick();
    }
    handleOpenChange(false);
  };

  // If this tooltip shouldn't be shown, just render children
  if (!showTooltip && !forceShow) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <div className={cn(
            "relative group",
            showHighlight && "z-10",
            className
          )}>
            {children}
            {withIcon && (
              <div className={cn(
                "absolute -top-2 -right-2 text-white rounded-full p-0.5 shadow-md z-10",
                getVariantStyles(),
                showHighlight && "animate-pulse"
              )}>
                {getIcon()}
              </div>
            )}
            {showHighlight && !withIcon && (
              <div className="absolute inset-0 rounded-md bg-primary-foreground/5 border-2 border-primary/30 -m-0.5 animate-pulse pointer-events-none" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className={cn(
            "p-0 overflow-hidden",
            getTooltipSize()
          )}
          sideOffset={8}
        >
          <TooltipArrow className={cn(
            "fill-current",
            variant === 'info' ? "text-blue-500" : 
            variant === 'feature' ? "text-purple-500" : 
            "text-primary"
          )} />
          <div className="relative">
            <div className={cn(
              "p-1 w-full",
              variant === 'info' ? "bg-blue-500" : 
              variant === 'feature' ? "bg-purple-500" : 
              "bg-primary"
            )}>
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0 text-white/80 hover:text-white hover:bg-white/10" 
                  onClick={() => handleOpenChange(false)}
                >
                  <X size={12} />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            
            <div className="p-3">
              <div className="text-sm">
                {typeof content === 'string' ? (
                  <p>{content}</p>
                ) : (
                  content
                )}
              </div>
              
              <div className="mt-3 flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs" 
                  onClick={() => handleOpenChange(false)}
                >
                  Got it
                </Button>
                
                {action && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-7 text-xs" 
                    onClick={handleAction}
                  >
                    {action.text}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 