'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackDMEvent, simulateDMEvents } from "@/lib/tracking/dmEvents";
import { Eye, MessageCircle, DollarSign } from "lucide-react";

interface MockMessageControlsProps {
  messageId: string;
  showControls?: boolean;
}

/**
 * Development-only component for simulating DM message events
 * This helps test the tracking system without needing real user interactions
 */
export function MockMessageControls({
  messageId,
  showControls = true
}: MockMessageControlsProps) {
  const [responseRate, setResponseRate] = useState(0.7);
  const [conversionRate, setConversionRate] = useState(0.3);
  const [delayMs, setDelayMs] = useState(2000);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Ensure this component only appears in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  if (!showControls) {
    return (
      <div className="flex gap-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => trackDMEvent(messageId, 'open')}
        >
          <Eye className="h-3 w-3 mr-1" />
          Track Open
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => trackDMEvent(messageId, 'response')}
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Track Response
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => trackDMEvent(messageId, 'conversion')}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          Track Conversion
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="mt-4 border-dashed border-orange-300 dark:border-orange-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Developer Controls</CardTitle>
            <CardDescription>Simulate user engagement events</CardDescription>
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Dev Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Response Rate</Label>
              <span className="text-xs">{Math.round(responseRate * 100)}%</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[responseRate]}
              onValueChange={(values) => setResponseRate(values[0])}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Conversion Rate</Label>
              <span className="text-xs">{Math.round(conversionRate * 100)}%</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[conversionRate]}
              onValueChange={(values) => setConversionRate(values[0])}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Initial Delay (ms)</Label>
            <Input
              type="number"
              min="100"
              max="10000"
              value={delayMs}
              onChange={(e) => setDelayMs(parseInt(e.target.value) || 2000)}
              className="h-8 text-xs"
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => {
                setIsSimulating(true);
                simulateDMEvents(messageId, delayMs, responseRate, conversionRate)
                  .finally(() => setIsSimulating(false));
              }}
              disabled={isSimulating}
              className="w-full"
              size="sm"
            >
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => trackDMEvent(messageId, 'open')}
            >
              Track Open
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 