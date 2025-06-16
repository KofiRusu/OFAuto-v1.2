import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  showHome = true,
  homeHref = '/dashboard',
}) => {
  const allItems = showHome
    ? [{ label: 'Home', href: homeHref, icon: Home }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground/50">
                  {separator}
                </span>
              )}
              
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'flex items-center gap-1.5 font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 text-muted-foreground transition-colors',
                    'hover:text-foreground focus:text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                    'rounded-sm px-1 -mx-1'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Responsive breadcrumb that collapses on mobile
const ResponsiveBreadcrumb: React.FC<BreadcrumbProps> = (props) => {
  const { items, ...rest } = props;
  
  // On mobile, show only first and last item with "..." in between
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (items.length <= 2) {
    return <Breadcrumb items={items} {...rest} />;
  }
  
  const collapsedItems = isExpanded
    ? items
    : [
        items[0],
        { label: '...', href: undefined },
        items[items.length - 1],
      ];

  return (
    <div className="relative">
      <div className="sm:hidden">
        <Breadcrumb
          items={collapsedItems}
          {...rest}
          className={cn(props.className, 'cursor-pointer')}
        />
        {!isExpanded && items.length > 2 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute inset-0 w-full h-full opacity-0"
            aria-label="Expand breadcrumb"
          />
        )}
      </div>
      <div className="hidden sm:block">
        <Breadcrumb items={items} {...rest} />
      </div>
    </div>
  );
};

// Hook to generate breadcrumbs from pathname
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({ label, href });
    });
    
    return breadcrumbs;
  }, [pathname]);
}

export { Breadcrumb, ResponsiveBreadcrumb };