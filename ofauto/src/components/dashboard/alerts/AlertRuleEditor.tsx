'use client';

import { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, 
    DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, BellRing } from 'lucide-react';
import { Platform } from "@/lib/types"; // Assuming shared type
import { AlertRule } from "./AlertCenterPanel"; // Assuming type is exported

const platforms: Platform[] = ['onlyfans', 'fansly', 'patreon', 'kofi', 'instagram', 'twitter'];
const metrics = [
  { value: 'engagement_rate', label: 'Engagement Rate', unit: '%' },
  { value: 'follower_count', label: 'Follower Count', unit: 'count' },
  { value: 'earnings_daily', label: 'Daily Earnings', unit: '$' },
  { value: 'messages_unread', label: 'Unread Messages', unit: 'count' },
  { value: 'api_errors', label: 'API Errors', unit: 'count' },
];
const conditions = ['drops_below', 'increases_above', 'equals'];
const timeframes = ['last_hour', 'last_day', 'last_week'];
const channels = [
    { id: 'in_app', label: 'In-App Notification' },
    { id: 'email', label: 'Email' },
    { id: 'slack', label: 'Slack Webhook' },
];

interface AlertRuleEditorProps {
  rule?: AlertRule | null; // Pass rule to edit, null/undefined to create
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ruleData: Omit<AlertRule, 'id' | 'lastChecked' | 'lastTriggered'>) => Promise<void>;
}

export default function AlertRuleEditor({ rule, isOpen, onOpenChange, onSave }: AlertRuleEditorProps) {
  const [platform, setPlatform] = useState<Platform>(rule?.platform || 'onlyfans');
  const [metric, setMetric] = useState(rule?.metric || metrics[0].value);
  const [condition, setCondition] = useState(rule?.condition || conditions[0]);
  const [threshold, setThreshold] = useState(rule?.threshold?.toString() || '');
  const [timeframe, setTimeframe] = useState(rule?.timeframe || timeframes[0]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(rule?.channels || [channels[0].id]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when rule changes (e.g., opening for create vs edit)
  useEffect(() => {
    if (isOpen) {
      setPlatform(rule?.platform || 'onlyfans');
      setMetric(rule?.metric || metrics[0].value);
      setCondition(rule?.condition || conditions[0]);
      setThreshold(rule?.threshold?.toString() || '');
      setTimeframe(rule?.timeframe || timeframes[0]);
      setSelectedChannels(rule?.channels || [channels[0].id]);
    } else {
      // Optionally clear form on close, or keep state?
    }
  }, [rule, isOpen]);

  const handleChannelChange = (channelId: string, checked: boolean) => {
    setSelectedChannels(prev => 
      checked ? [...prev, channelId] : prev.filter(id => id !== channelId)
    );
  };

  const getMetricUnit = () => metrics.find(m => m.value === metric)?.unit || '';

  const handleSubmit = async () => {
    setIsLoading(true);
    const ruleData = {
      platform,
      metric,
      condition,
      threshold: parseFloat(threshold), // Ensure it's a number
      timeframe,
      channels: selectedChannels,
      isEnabled: rule?.isEnabled ?? true, // Default to enabled on create
    };
    
    if (isNaN(ruleData.threshold)) {
        toast({ variant: "destructive", title: "Invalid Threshold", description: "Please enter a valid number for the threshold." });
        setIsLoading(false);
        return;
    }
    if (selectedChannels.length === 0) {
         toast({ variant: "destructive", title: "No Delivery Channel", description: "Please select at least one notification channel." });
        setIsLoading(false);
        return;
    }

    try {
      await onSave(ruleData);
      onOpenChange(false); // Close modal on success
    } catch (error) {
        // Error toast is likely handled in the parent onSave function
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Alert Rule' : 'Create New Alert Rule'}</DialogTitle>
          <DialogDescription>
            Configure conditions to trigger notifications for important events.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Platform */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger id="platform" className="col-span-3">
                    <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                    {platforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          {/* Metric */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">Metric</Label>
             <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger id="metric" className="col-span-3">
                    <SelectValue placeholder="Select Metric" />
                </SelectTrigger>
                <SelectContent>
                    {metrics.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          {/* Condition & Threshold */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition" className="text-right">Condition</Label>
            <div className="col-span-3 grid grid-cols-3 gap-2">
                <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger id="condition" className="col-span-2">
                        <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                        {conditions.map(c => 
                            <SelectItem key={c} value={c}>{
                                c === 'drops_below' ? 'Drops Below' : 
                                c === 'increases_above' ? 'Increases Above' : 'Equals'
                            }</SelectItem>)}
                    </SelectContent>
                </Select>
                 <div className="relative col-span-1">
                    <Input 
                        id="threshold" 
                        type="number" 
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        placeholder="Value" 
                        required
                        className={getMetricUnit() === '$' ? "pl-7" : getMetricUnit() === '%' ? "pr-7" : ""}
                     />
                     {getMetricUnit() && (
                         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{getMetricUnit()}</span>
                     )}
                      {getMetricUnit() === '$' && (
                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{getMetricUnit()}</span>
                     )}
                 </div>
            </div>
          </div>
          
           {/* Timeframe */}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeframe" className="text-right">Timeframe</Label>
             <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe" className="col-span-3">
                    <SelectValue placeholder="Select Timeframe" />
                </SelectTrigger>
                <SelectContent>
                    {timeframes.map(t => 
                        <SelectItem key={t} value={t}>{
                             t === 'last_hour' ? 'Last Hour' : 
                             t === 'last_day' ? 'Last 24 Hours' : 'Last 7 Days'
                         }</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          {/* Delivery Channels */}
          <div className="grid grid-cols-4 items-start gap-4 pt-4 border-t">
            <Label className="text-right mt-2">Notify Via</Label>
            <div className="col-span-3 space-y-3">
                {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={channel.id}
                            checked={selectedChannels.includes(channel.id)}
                            onCheckedChange={(checked) => handleChannelChange(channel.id, !!checked)}
                        />
                        <label
                            htmlFor={channel.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {channel.label}
                        </label>
                        {channel.id === 'slack' && selectedChannels.includes('slack') && (
                            <Input type="url" placeholder="Enter Slack Webhook URL" className="h-8 ml-4"/>
                        )}
                    </div>
                ))}
                {selectedChannels.length === 0 && <p className="text-xs text-destructive">Select at least one channel.</p>}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedChannels.length === 0 || !threshold}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rule ? 'Save Changes' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 