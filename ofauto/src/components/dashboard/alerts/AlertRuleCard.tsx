import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertRule } from "./AlertCenterPanel"; // Assuming type is exported
import { formatDistanceToNow } from 'date-fns';
import { 
    Bell, 
    Trash2, 
    Pencil, 
    Activity, 
    AlertTriangle, 
    CheckCircle, 
    Mail, 
    MessageCircle, 
    BellOff 
} from "lucide-react";

interface AlertRuleCardProps {
  rule: AlertRule;
  onToggle: (id: string, isEnabled: boolean) => void;
  onEdit: (rule: AlertRule) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

// Mock helper - replace with actual metric/condition mapping
const formatCondition = (rule: AlertRule): string => {
    const metricLabel = rule.metric.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    const condLabel = rule.condition === 'drops_below' ? 'drops below' : 
                      rule.condition === 'increases_above' ? 'increases above' : 'equals';
    const timeLabel = rule.timeframe === 'last_hour' ? 'in last hour' : 
                      rule.timeframe === 'last_day' ? 'in last 24h' : 'in last 7d';
    return `${metricLabel} ${condLabel} ${rule.threshold} ${timeLabel}`;
};

export default function AlertRuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
  isDeleting,
}: AlertRuleCardProps) {
    
  const platformIcons = {
      onlyfans: Activity, fansly: Activity, patreon: Activity, kofi: Activity, 
      instagram: Activity, twitter: Activity, all: Activity 
  };
  const PlatformIcon = platformIcons[rule.platform as keyof typeof platformIcons] || Activity;

  return (
    <Card className="flex flex-col justify-between">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PlatformIcon size={18} />
                    <span className="capitalize">{rule.platform} Alert</span>
                </CardTitle>
                <Switch 
                    checked={rule.isEnabled}
                    onCheckedChange={(checked) => onToggle(rule.id, checked)}
                    disabled={isToggling}
                    aria-label={rule.isEnabled ? "Disable Alert" : "Enable Alert"}
                 />
            </div>
            <CardDescription className="pt-1">
                Notify when: {formatCondition(rule)}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow py-2 space-y-2">
             <div className="flex flex-wrap items-center gap-1.5 text-xs">
                 <span className="text-muted-foreground">Channels:</span>
                 {rule.channels.map(channel => (
                     <Badge key={channel} variant="secondary" className="font-normal">
                        {channel === 'in_app' ? <Bell size={12} className="mr-1" /> : 
                         channel === 'email' ? <Mail size={12} className="mr-1" /> : 
                         <MessageCircle size={12} className="mr-1" /> }
                         {channel.replace(/_/g, ' ').replace('in app', 'In-App').replace(/(?:^|\s)\S/g, a => a.toUpperCase())}
                    </Badge>
                 ))}
             </div>
             <div className="text-xs text-muted-foreground">
                {rule.lastTriggered ? (
                    <span className="text-orange-600 flex items-center"><AlertTriangle size={13} className="mr-1"/> Last triggered: {formatDistanceToNow(rule.lastTriggered, { addSuffix: true })}</span>
                 ) : rule.lastChecked ? (
                    <span className="text-green-600 flex items-center"><CheckCircle size={13} className="mr-1"/> Last checked: {formatDistanceToNow(rule.lastChecked, { addSuffix: true })}</span>
                 ) : (
                     <span>Not checked yet.</span>
                 )}
             </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-1">
             <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80 h-7 w-7"
                            onClick={() => onDelete(rule.id)}
                            disabled={isDeleting}
                         >
                            <Trash2 size={15} />
                         </Button>
                     </TooltipTrigger>
                    <TooltipContent><p>Delete Rule</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => onEdit(rule)}
                         >
                            <Pencil size={15} />
                         </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Edit Rule</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
        </CardFooter>
    </Card>
  );
} 