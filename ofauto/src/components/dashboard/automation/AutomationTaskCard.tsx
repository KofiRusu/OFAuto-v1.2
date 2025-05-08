import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
    Bot, 
    Clock, 
    RefreshCw, 
    XCircle, 
    CheckCircle, 
    AlertCircle, 
    Info, 
    Activity, 
    DollarSign, 
    MessageSquare, 
    Send, 
    Tag, 
    Brain, 
    Loader2,
    BarChart,
    UserPlus
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { AutomationTask } from "./AutomationQueuePanel"; // Assuming type is exported
import AutoPersonaTag from "@/components/dashboard/followers/AutoPersonaTag";

interface AutomationTaskCardProps {
  task: AutomationTask;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onInspect: (task: AutomationTask) => void;
  isRetrying: boolean;
  isCancelling: boolean;
}

// --- Mappings & Styles ---
const statusConfig = {
  queued: { 
    variant: 'warning', 
    icon: Clock,
    animate: false
  },
  running: { 
    variant: 'info', 
    icon: Loader2,
    animate: true
  },
  completed: { 
    variant: 'success', 
    icon: CheckCircle,
    animate: false
  },
  failed: { 
    variant: 'error', 
    icon: AlertCircle,
    animate: false
  },
  cancelled: { 
    variant: 'secondary', 
    icon: XCircle,
    animate: false
  },
};

const platformIcons = {
  onlyfans: Activity,
  fansly: Activity,
  patreon: Activity,
  kofi: Activity,
  instagram: Activity,
  twitter: Activity,
  // Add more specific icons later if needed
};

const actionTypeDetails = {
  'post': { name: 'Create Post', icon: Send },
  'message': { name: 'Send Message', icon: MessageSquare },
  'pricingUpdate': { name: 'Update Pricing', icon: DollarSign },
  'follow': { name: 'Follow User', icon: UserPlus },
  'analyze': { name: 'Run Analysis', icon: BarChart },
  // ... other action types
};

export default function AutomationTaskCard({ 
    task, 
    onRetry, 
    onCancel, 
    onInspect, 
    isRetrying, 
    isCancelling 
}: AutomationTaskCardProps) {
  
  const statusInfo = statusConfig[task.status] || statusConfig.queued;
  const StatusIcon = statusInfo.icon;
  const PlatformIcon = platformIcons[task.platform] || Bot;
  const actionDetail = actionTypeDetails[task.type as keyof typeof actionTypeDetails] || { name: task.type, icon: Activity };
  const ActionIcon = actionDetail.icon;

  return (
    <Card className={cn("overflow-hidden transition-all duration-200", 
      task.status === 'running' && "border-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]")}>
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <PlatformIcon size={18} className="text-muted-foreground" />
            {task.status === 'running' && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </div>
          <CardTitle className="text-sm font-medium capitalize">
            {task.platform} - {actionDetail.name}
          </CardTitle>
        </div>
        <Badge variant={statusInfo.variant as any}>
          <StatusIcon
            size={12}
            className={cn(
              "mr-1",
              statusInfo.animate && "animate-spin"
            )}
          /> 
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-2">
        <p className="text-muted-foreground text-xs">
          Task ID: {task.id}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {task.personaUsed && <AutoPersonaTag personaName={task.personaUsed} />}
          {task.strategyId && (
            <Badge variant="secondary" className="font-normal">
              <Brain size={12} className="mr-1" /> Strategy: {task.strategyId.substring(0, 8)}...
            </Badge>
          )}
        </div>
        
        {/* Maybe show a snippet of the payload? */}
        {task.payload?.message && ( 
          <p className="italic text-muted-foreground truncate text-xs">
            "{task.payload.message}"
          </p>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          Created: {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })} 
          {task.executedAt && task.status !== 'running' && 
            ` | Finished: ${formatDistanceToNow(new Date(task.executedAt), { addSuffix: true })}`}
        </p>
        
        {task.status === 'failed' && task.errorLog && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-xs border border-red-200">
            <p className="font-semibold">Error:</p>
            <p className="truncate">{task.errorLog}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
        {(task.status === 'queued' || task.status === 'running') && (
          <Button 
            size="sm" 
            variant="outline"
            className="h-8"
            onClick={() => onCancel(task.id)}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> 
                Cancelling...
              </>
            ) : (
              <>
                <XCircle size={14} className="mr-1.5" /> 
                Cancel
              </>
            )}
          </Button>
        )}
        {task.status === 'failed' && (
          <Button 
            size="sm" 
            variant="outline"
            className="h-8"
            onClick={() => onRetry(task.id)}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> 
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw size={14} className="mr-1.5" /> 
                Retry
              </>
            )}
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8"
          onClick={() => onInspect(task)}
        >
          <Info size={14} className="mr-1.5" />
          Inspect
        </Button>
      </CardFooter>
    </Card>
  );
} 