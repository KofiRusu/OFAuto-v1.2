import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertCircle,
  Clock,
  Info,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
  CheckCircle,
  ListFilter,
  Calendar
} from 'lucide-react';
import { formatDistance, format } from 'date-fns';
import { AutomationTask } from '@/lib/hooks/useAutomationStore';

// Mock data for tasks
const mockTasks: AutomationTask[] = [
  {
    id: '1',
    automationId: '1',
    title: 'Send re-engagement message',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    actionType: 'message',
    platform: 'onlyfans',
    status: 'completed',
    result: { messageId: 'msg123', recipientCount: 15 },
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 3540000).toISOString(),
    createdAt: new Date(Date.now() - 3700000).toISOString(),
    updatedAt: new Date(Date.now() - 3540000).toISOString()
  },
  {
    id: '2',
    automationId: '1',
    title: 'Send re-engagement message',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    actionType: 'message',
    platform: 'fansly',
    status: 'running',
    startTime: new Date(Date.now() - 600000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: '3',
    automationId: '2',
    title: 'Update subscription price',
    description: 'Adjust pricing when ROI exceeds targets',
    actionType: 'pricing',
    platform: 'onlyfans',
    status: 'queued',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '4',
    automationId: '3',
    title: 'Send promotional message',
    description: 'Boost content visibility when campaigns aren\'t meeting goals',
    actionType: 'message',
    platform: 'instagram',
    status: 'failed',
    error: 'API rate limit exceeded',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86340000).toISOString(),
    createdAt: new Date(Date.now() - 86500000).toISOString(),
    updatedAt: new Date(Date.now() - 86340000).toISOString()
  }
];

interface TaskMonitorProps {
  clientId?: string | null;
}

export default function TaskMonitor({ clientId }: TaskMonitorProps) {
  // State
  const [tasks, setTasks] = React.useState<AutomationTask[]>(mockTasks);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<AutomationTask | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [platformFilter, setPlatformFilter] = React.useState<string>('');
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  
  // Filter tasks based on search term, status, platform, and action type
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = !statusFilter || task.status === statusFilter;
      
      // Platform filter
      const matchesPlatform = !platformFilter || task.platform === platformFilter;
      
      // Action type filter (based on tab)
      const matchesTab = selectedTab === 'all' || task.actionType === selectedTab;
      
      return matchesSearch && matchesStatus && matchesPlatform && matchesTab;
    });
  }, [tasks, searchTerm, statusFilter, platformFilter, selectedTab]);
  
  // Simulate loading tasks
  React.useEffect(() => {
    if (clientId) {
      setIsLoading(true);
      // In a real implementation, this would be an API call to fetch tasks for this client
      setTimeout(() => {
        setTasks(mockTasks);
        setIsLoading(false);
      }, 1000);
    }
  }, [clientId]);
  
  // Refresh tasks
  const handleRefresh = () => {
    setIsLoading(true);
    // In a real implementation, this would refetch the tasks
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Retry a failed task
  const handleRetryTask = (taskId: string) => {
    console.log(`Retrying task: ${taskId}`);
    // In a real implementation, this would call the API to retry the task
    
    // For mock purposes, update the status
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'queued', error: undefined, updatedAt: new Date().toISOString() } 
        : task
    ));
  };
  
  // Cancel a queued task
  const handleCancelTask = (taskId: string) => {
    console.log(`Canceling task: ${taskId}`);
    // In a real implementation, this would call the API to cancel the task
    
    // For mock purposes, update the status
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'cancelled', updatedAt: new Date().toISOString() } 
        : task
    ));
  };
  
  // View task details
  const handleViewTaskDetails = (task: AutomationTask) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };
  
  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Queued</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper to get platform badge
  const getPlatformBadge = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'onlyfans':
        return <Badge className="bg-[#00AEEF] hover:bg-[#00AEEF]/80">OnlyFans</Badge>;
      case 'fansly':
        return <Badge className="bg-[#FF5E00] hover:bg-[#FF5E00]/80">Fansly</Badge>;
      case 'instagram':
        return <Badge className="bg-[#E1306C] hover:bg-[#E1306C]/80">Instagram</Badge>;
      case 'twitter':
        return <Badge className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/80">Twitter</Badge>;
      default:
        return <Badge>{platform}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All platforms</SelectItem>
              <SelectItem value="onlyfans">OnlyFans</SelectItem>
              <SelectItem value="fansly">Fansly</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
          <TabsTrigger value="post">Posts</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Monitor</CardTitle>
                  <CardDescription>
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {(statusFilter || platformFilter) && (
                    <Badge variant="outline" className="gap-1">
                      <ListFilter className="h-3 w-3 mr-1" />
                      Filters applied
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm || statusFilter || platformFilter || selectedTab !== 'all' 
                      ? "Try adjusting your filters to find what you're looking for."
                      : "No tasks have been created yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled/Started</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {task.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPlatformBadge(task.platform)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              {getStatusBadge(task.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.status === 'queued' && task.scheduledTime ? (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Scheduled: </span>
                                {formatDistance(new Date(task.scheduledTime), new Date(), { addSuffix: true })}
                              </div>
                            ) : task.startTime ? (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Started: </span>
                                {formatDistance(new Date(task.startTime), new Date(), { addSuffix: true })}
                              </div>
                            ) : (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Created: </span>
                                {formatDistance(new Date(task.createdAt), new Date(), { addSuffix: true })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {task.status === 'queued' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleCancelTask(task.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              {task.status === 'failed' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRetryTask(task.id)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Retry
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewTaskDetails(task)}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected task
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Task ID</Label>
                  <div className="font-mono text-sm">{selectedTask.id}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Title</Label>
                  <div className="font-medium">{selectedTask.title}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <div>{selectedTask.description}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Automation ID</Label>
                  <div className="font-mono text-sm">{selectedTask.automationId}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Platform</Label>
                  <div>{getPlatformBadge(selectedTask.platform)}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Action Type</Label>
                  <div className="capitalize">{selectedTask.actionType}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTask.status)}
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>
                
                {selectedTask.scheduledTime && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Scheduled Time</Label>
                    <div>{format(new Date(selectedTask.scheduledTime), 'PPP p')}</div>
                  </div>
                )}
                
                {selectedTask.startTime && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Start Time</Label>
                    <div>{format(new Date(selectedTask.startTime), 'PPP p')}</div>
                  </div>
                )}
                
                {selectedTask.endTime && (
                  <div>
                    <Label className="text-muted-foreground text-sm">End Time</Label>
                    <div>{format(new Date(selectedTask.endTime), 'PPP p')}</div>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground text-sm">Created At</Label>
                  <div>{format(new Date(selectedTask.createdAt), 'PPP p')}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-sm">Updated At</Label>
                  <div>{format(new Date(selectedTask.updatedAt), 'PPP p')}</div>
                </div>
              </div>
            </div>
            
            {selectedTask.result && (
              <div className="mt-4">
                <Label className="text-muted-foreground text-sm">Result</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md overflow-auto text-xs">
                  {JSON.stringify(selectedTask.result, null, 2)}
                </pre>
              </div>
            )}
            
            {selectedTask.error && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedTask.error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              {selectedTask.status === 'failed' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleRetryTask(selectedTask.id);
                    setIsDetailsModalOpen(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Task
                </Button>
              )}
              
              {selectedTask.status === 'queued' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleCancelTask(selectedTask.id);
                    setIsDetailsModalOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Task
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 