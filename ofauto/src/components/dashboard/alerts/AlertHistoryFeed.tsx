'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { AlertRule } from "./AlertCenterPanel"; // Assuming type is exported

export interface AlertHistoryEntry {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  severity: 'warning' | 'danger' | 'info';
  message: string; // e.g., "OnlyFans Engagement Rate dropped below 5%"
}

interface AlertHistoryFeedProps {
  history: AlertHistoryEntry[];
  isLoading: boolean;
}

export default function AlertHistoryFeed({ history, isLoading }: AlertHistoryFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No triggered alerts found in this period.
      </div>
    );
  }

  const SeverityIcon = ({ severity }: { severity: string }) => {
    if (severity === 'danger') return <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  };

  return (
    <ScrollArea className="h-72 rounded-md border p-3">
        <div className="space-y-3">
        {history.map(entry => (
            <div key={entry.id} className="flex items-start gap-3">
               <SeverityIcon severity={entry.severity} />
                <div className="flex-grow">
                    <p className="text-sm font-medium">{entry.message}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(entry.triggeredAt, { addSuffix: true })}
                    </p>
                </div>
            </div>
        ))}
        </div>
    </ScrollArea>
  );
} 