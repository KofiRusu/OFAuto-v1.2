'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AutomationTask } from "./AutomationQueuePanel"; // Assuming type is exported
import { format } from 'date-fns';
import { Code, Clock, AlertCircle, CheckCircle, Bot } from 'lucide-react';

interface TaskInspectorModalProps {
  task: AutomationTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskInspectorModal({ task, isOpen, onClose }: TaskInspectorModalProps) {
  if (!task) return null;

  const statusStyles = {
    queued: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    running: { color: 'bg-blue-100 text-blue-800', icon: Loader2 }, // Needs Loader2 from lucide
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }, // Needs XCircle
  };
  const currentStatus = statusStyles[task.status] || statusStyles.queued;
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Task Details: {task.id}</DialogTitle>
          <DialogDescription>
            Inspect the details, payload, and logs for this automation task.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 py-4 px-1 pr-4">
             {/* Basic Info */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant="outline" className={currentStatus.color}>
                 <StatusIcon size={14} className={`mr-1.5 ${task.status === 'running' ? 'animate-spin' : ''}`} /> 
                 {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>

              <span className="text-sm font-medium text-muted-foreground">Platform</span>
              <span className="capitalize">{task.platform}</span>
              
              <span className="text-sm font-medium text-muted-foreground">Action Type</span>
              <span>{task.type}</span>
              
              {task.personaUsed && (
                <>
                  <span className="text-sm font-medium text-muted-foreground">Persona</span>
                  <span>{task.personaUsed}</span>
                </>
              )}
              {task.strategyId && (
                <>
                  <span className="text-sm font-medium text-muted-foreground">Strategy ID</span>
                  <span>{task.strategyId}</span>
                </>
              )}
              
              <span className="text-sm font-medium text-muted-foreground">Created</span>
              <span>{format(task.createdAt, 'PPP p')}</span>
              
              {task.executedAt && (
                 <>
                  <span className="text-sm font-medium text-muted-foreground">Executed</span>
                  <span>{format(task.executedAt, 'PPP p')}</span>
                 </>
              )}
            </div>
            
            <Separator />
            
            {/* Payload */}
            <div>
                <h4 className="text-sm font-medium mb-2">Payload</h4>
                <pre className="p-3 rounded-md bg-muted text-xs overflow-x-auto">
                    {JSON.stringify(task.payload || { info: 'No payload data' }, null, 2)}
                </pre>
            </div>
            
            <Separator />

             {/* Logs */}
            <div>
                <h4 className="text-sm font-medium mb-2">Execution Log</h4>
                {task.errorLog ? (
                     <pre className="p-3 rounded-md bg-destructive/10 text-destructive text-xs overflow-x-auto">
                        {task.errorLog}
                     </pre>
                ) : task.status === 'completed' || task.status === 'running' ? (
                     <pre className="p-3 rounded-md bg-muted text-xs overflow-x-auto">
                        {/* Mock Logs - Replace with actual logs */} 
                        {`[${format(task.createdAt, 'p')}] Task received.
`}
                        {task.status !== 'queued' && `[${format(task.executedAt || new Date(), 'p')}] Connecting to ${task.platform} adapter...
`}
                        {task.status === 'running' && `[${format(new Date(), 'p')}] Executing action: ${task.type}...
`}
                        {task.status === 'completed' && `[${format(task.executedAt!, 'p')}] Action completed successfully.
`}
                     </pre>
                ) : (
                    <p className="text-xs text-muted-foreground italic">No logs available for this task yet.</p>
                )}
            </div>

          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 