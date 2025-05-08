import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignItem } from '@/lib/trpc/routers/campaignPlanner';
import { CampaignCard } from '@/components/dashboard/CampaignCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, ClipboardList, CheckCircle, AlertCircle, FilePen } from 'lucide-react';

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  itemStates: string[];
  color: string;
}

interface KanbanBoardProps {
  items: CampaignItem[];
  onItemClick?: (item: CampaignItem) => void;
  onEditItem?: (item: CampaignItem) => void;
  onDeleteItem?: (item: CampaignItem) => void;
  onRescheduleItem?: (item: CampaignItem) => void;
  onDragEnd?: (result: any) => void;
  className?: string;
}

export const KanbanBoard = ({
  items,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onRescheduleItem,
  onDragEnd,
  className,
}: KanbanBoardProps) => {
  // Define the columns for the Kanban board
  const columns: KanbanColumn[] = [
    {
      id: 'draft',
      title: 'Drafts',
      icon: <FilePen className="h-5 w-5" />,
      description: 'Items in preparation',
      itemStates: ['draft'],
      color: 'bg-muted text-muted-foreground',
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      icon: <Clock className="h-5 w-5" />,
      description: 'Upcoming items',
      itemStates: ['scheduled'],
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: <ClipboardList className="h-5 w-5" />,
      description: 'Currently sending',
      itemStates: ['sending'],
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: <CheckCircle className="h-5 w-5" />,
      description: 'Successfully sent',
      itemStates: ['sent'],
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    {
      id: 'failed',
      title: 'Failed',
      icon: <AlertCircle className="h-5 w-5" />,
      description: 'Requires attention',
      itemStates: ['failed'],
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
  ];

  // Group items by status
  const getColumnItems = (column: KanbanColumn) => {
    return items.filter(item => column.itemStates.includes(item.status));
  };

  // Sort items by scheduled date (ascending)
  const sortItems = (items: CampaignItem[]) => {
    return [...items].sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  };
  
  return (
    <div className={cn('w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4', className)}>
      {columns.map((column) => {
        const columnItems = sortItems(getColumnItems(column));
        
        return (
          <Card key={column.id} className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
            <CardHeader className="px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-md', column.color)}>
                    {column.icon}
                  </div>
                  <CardTitle className="text-base font-medium">
                    {column.title}
                  </CardTitle>
                </div>
                <Badge variant="outline">{columnItems.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {column.description}
              </p>
            </CardHeader>
            
            <CardContent className="p-2 flex-1 overflow-hidden">
              <ScrollArea className="h-full pl-1 pr-3">
                <div className="flex flex-col gap-3 pb-3 pt-1">
                  {columnItems.length === 0 ? (
                    <div className="flex justify-center items-center h-32 text-center border border-dashed rounded-md p-4">
                      <p className="text-sm text-muted-foreground">
                        No items in this column
                      </p>
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <CampaignCard
                        key={item.id}
                        item={item}
                        onClick={onItemClick}
                        onEdit={onEditItem}
                        onDelete={onDeleteItem}
                        onReschedule={onRescheduleItem}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 