'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MegaMenuProps {
  items: MegaMenuItem[];
  className?: string;
}

interface MegaMenuItem {
  title: string;
  href?: string;
  description?: string;
  items?: {
    title: string;
    href: string;
    description?: string;
    icon?: React.ReactNode;
    badge?: {
      text: string;
      variant: 'default' | 'outline' | 'secondary' | 'destructive';
    };
  }[];
  button?: {
    title: string;
    href: string;
    icon?: React.ReactNode;
  };
}

export function MegaMenu({ items, className }: MegaMenuProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <nav className={cn('relative z-50 flex gap-1', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50',
              )}
            >
              {item.title}
            </Link>
          ) : (
            <div
              className={cn(
                'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50',
                activeIndex === index && 'bg-accent/50',
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            >
              {item.title}
              <ChevronDown
                className="ml-1 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </div>
          )}
        </React.Fragment>
      ))}
      
      {/* Mega menu dropdowns */}
      {items.map((item, index) => (
        item.items && (
          <div
            key={index}
            className={cn(
              'absolute left-0 top-full w-full gap-4 rounded-md border bg-popover p-4 shadow-md',
              'transition-all duration-100 ease-in-out',
              activeIndex === index ? 'animate-in fade-in-0 zoom-in-95' : 'hidden',
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {/* Menu header with description */}
            {item.description && (
              <div className="mb-4 border-b pb-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )}
            
            {/* Menu items grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {item.items.map((subItem, subIndex) => (
                <Link
                  key={subIndex}
                  href={subItem.href}
                  className="group flex flex-col gap-2 rounded-md p-3 text-sm hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background group-hover:border-primary">
                      {subItem.icon || <Circle className="h-4 w-4" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-medium">{subItem.title}</h4>
                      {subItem.badge && (
                        <span className={cn(
                          'ml-2 rounded-full px-2 py-0.5 text-xs',
                          subItem.badge.variant === 'default' && 'bg-primary text-primary-foreground',
                          subItem.badge.variant === 'secondary' && 'bg-secondary text-secondary-foreground',
                          subItem.badge.variant === 'destructive' && 'bg-destructive text-destructive-foreground',
                          subItem.badge.variant === 'outline' && 'border border-primary text-primary',
                        )}>
                          {subItem.badge.text}
                        </span>
                      )}
                    </div>
                  </div>
                  {subItem.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {subItem.description}
                    </p>
                  )}
                </Link>
              ))}
              
              {/* Call to action button */}
              {item.button && (
                <Link
                  href={item.button.href}
                  className="group flex h-full flex-col justify-center gap-2 rounded-md border border-dashed p-3 text-sm hover:border-primary hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background group-hover:border-primary">
                      {item.button.icon || <Plus className="h-4 w-4" />}
                    </div>
                    <h4 className="font-medium">{item.button.title}</h4>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )
      ))}
    </nav>
  );
}

interface SimpleMegaMenuProps {
  trigger: React.ReactNode;
  items: {
    title: string;
    href: string;
    description?: string;
    icon?: React.ReactNode;
  }[];
  title?: string;
  description?: string;
  className?: string;
  align?: 'left' | 'right';
}

export function SimpleMegaMenu({ 
  trigger, 
  items, 
  title, 
  description, 
  className,
  align = 'left'
}: SimpleMegaMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className={cn('relative', className)}
      ref={ref}
    >
      {/* Trigger */}
      <div
        className="flex cursor-pointer items-center gap-1 rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        {trigger}
      </div>
      
      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[240px] rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95',
            align === 'left' ? 'left-0' : 'right-0'
          )}
          onMouseLeave={() => setIsOpen(false)}
        >
          {(title || description) && (
            <div className="border-b p-4">
              {title && <h3 className="text-sm font-medium">{title}</h3>}
              {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
            </div>
          )}
          <div className="p-2">
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm"
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <div>
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 