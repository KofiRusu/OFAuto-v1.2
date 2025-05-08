import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { CampaignItem } from '@/lib/trpc/routers/campaignPlanner';
import { CalendarGrid } from '@/components/ui/CalendarGrid';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { trpc } from '@/lib/trpc/client';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  LayoutDashboard,
  Plus,
  Search,
  X,
  Filter,
  RefreshCw,
  Trash2,
} from 'lucide-react';

// Platform options with icons in comment form for reference
const platformOptions = [
  { value: 'all', label: 'All Platforms' },
  { value: 'onlyfans', label: 'OnlyFans' },
  { value: 'fansly', label: 'Fansly' },
  { value: 'patreon', label: 'Patreon' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
];

// Item type options
const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'post', label: 'Posts' },
  { value: 'dm', label: 'DMs' },
  { value: 'experiment', label: 'Experiments' },
];

// Status options
const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

interface CampaignPlannerProps {
  clientId: string;
  className?: string;
}

export function CampaignPlanner({ clientId, className }: CampaignPlannerProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for view and filters
  const [view, setView] = useState<'calendar' | 'kanban'>('calendar');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<CampaignItem | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState<boolean>(false);
  const [itemToReschedule, setItemToReschedule] = useState<CampaignItem | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>(undefined);
  
  // Query campaign items with filters
  const {
    data: campaignItems,
    isLoading,
    isError,
    refetch,
  } = trpc.campaignPlanner.getCampaignSchedule.useQuery(
    {
      clientId,
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      type: (typeFilter !== 'all' ? typeFilter : undefined) as any,
      status: (statusFilter !== 'all' ? statusFilter : undefined) as any,
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  
  // Update item mutation
  const updateItemMutation = trpc.campaignPlanner.updateCampaignItem.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    },
  });
  
  // Filter items by search query
  const filteredItems = campaignItems
    ? campaignItems.filter((item) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          (item.content && item.content.toLowerCase().includes(query))
        );
      })
    : [];
  
  // Handle item click - navigate to edit page
  const handleItemClick = (item: CampaignItem) => {
    switch (item.type) {
      case 'post':
        router.push(`/dashboard/posts/edit/${item.id}`);
        break;
      case 'dm':
        router.push(`/dashboard/messages/edit/${item.id}`);
        break;
      case 'experiment':
        router.push(`/dashboard/experiments/edit/${item.id}`);
        break;
    }
  };
  
  // Handle create new item
  const handleCreateItem = (date?: Date) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      router.push(`/dashboard/posts/new?date=${formattedDate}`);
    } else {
      router.push('/dashboard/posts/new');
    }
  };
  
  // Handle edit item
  const handleEditItem = (item: CampaignItem) => {
    handleItemClick(item);
  };
  
  // Handle delete item
  const handleDeleteClick = (item: CampaignItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // In a real implementation, you would call a mutation to delete the item
      toast({
        title: 'Item Deleted',
        description: 'The item has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Handle reschedule item
  const handleRescheduleClick = (item: CampaignItem) => {
    setItemToReschedule(item);
    setNewScheduleDate(item.scheduledFor);
    setIsRescheduleDialogOpen(true);
  };
  
  const confirmReschedule = async () => {
    if (!itemToReschedule || !newScheduleDate) return;
    
    updateItemMutation.mutate({
      id: itemToReschedule.id,
      type: itemToReschedule.type,
      scheduledFor: newScheduleDate,
    });
    
    setIsRescheduleDialogOpen(false);
    setItemToReschedule(null);
    setNewScheduleDate(undefined);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setPlatformFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };
  
  // Check if any filters are applied
  const hasFilters = platformFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || searchQuery.length > 0;
  
  return (
    <div className={className}>
      {/* Header with filters */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campaign Planner</h1>
            <p className="text-muted-foreground">
              Plan, schedule, and manage your content across all platforms
            </p>
          </div>
          
          <Button 
            onClick={() => handleCreateItem()} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* View selector */}
            <Tabs 
              value={view} 
              onValueChange={(v) => setView(v as 'calendar' | 'kanban')}
              className="mr-2"
            >
              <TabsList>
                <TabsTrigger value="calendar" className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Board</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Calendar view selector (only shown in calendar view) */}
            {view === 'calendar' && (
              <Select 
                value={calendarView} 
                onValueChange={(v) => setCalendarView(v as 'month' | 'week')}
              >
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {/* Platform filter */}
            <Select 
              value={platformFilter} 
              onValueChange={setPlatformFilter}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Clear filters button */}
            {hasFilters && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 h-9 w-[180px] lg:w-[240px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Refresh button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading campaign items...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <Card className="bg-destructive/10 border-destructive/30 my-4">
          <CardContent className="py-6 flex flex-col items-center text-center">
            <X className="h-8 w-8 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Failed to load campaign items</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your campaign data. Please try again.
            </p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Empty state */}
      {!isLoading && !isError && filteredItems.length === 0 && (
        <Card className="border-dashed my-4">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <CalendarIcon className="h-10 w-10 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No scheduled items</h3>
            {hasFilters ? (
              <div className="max-w-md">
                <p className="text-muted-foreground mb-4">
                  No items match your current filters. Try adjusting your filters or creating new content.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="gap-2 mr-2"
                >
                  <Filter className="h-4 w-4" /> Clear Filters
                </Button>
                <Button 
                  onClick={() => handleCreateItem()} 
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> New Post
                </Button>
              </div>
            ) : (
              <div className="max-w-md">
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first post, DM campaign, or experiment.
                </p>
                <Button 
                  onClick={() => handleCreateItem()} 
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> New Post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Content views */}
      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="mt-2">
          {view === 'calendar' ? (
            <CalendarGrid
              items={filteredItems}
              view={calendarView}
              onCreateItem={handleCreateItem}
              onItemClick={handleItemClick}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteClick}
              onRescheduleItem={handleRescheduleClick}
            />
          ) : (
            <KanbanBoard
              items={filteredItems}
              onItemClick={handleItemClick}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteClick}
              onRescheduleItem={handleRescheduleClick}
            />
          )}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {itemToDelete && (
            <div className="py-2">
              <p className="font-medium">{itemToDelete.title}</p>
              <p className="text-sm text-muted-foreground">
                Scheduled for {format(itemToDelete.scheduledFor, 'PPP')} at {format(itemToDelete.scheduledFor, 'p')}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reschedule dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Item</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this scheduled item.
            </DialogDescription>
          </DialogHeader>
          
          {itemToReschedule && (
            <div className="space-y-4 py-2">
              <div>
                <p className="font-medium">{itemToReschedule.title}</p>
                <p className="text-sm text-muted-foreground">
                  Currently scheduled for: {format(itemToReschedule.scheduledFor, 'PPP')} at {format(itemToReschedule.scheduledFor, 'p')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Schedule Date</Label>
                <DatePicker
                  date={newScheduleDate}
                  setDate={setNewScheduleDate}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={!newScheduleDate}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" /> Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 