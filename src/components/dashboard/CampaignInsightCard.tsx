'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  AlertCircle,
  Info,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { InsightItem } from '@/lib/services/reasoningService';
import { CampaignKPIMetric } from '@/lib/services/reasoningService';

interface CampaignInsightCardProps {
  insight: InsightItem & {
    kpiData?: CampaignKPIMetric;
    severity?: 'critical' | 'warning' | 'info';
    actionType?: string;
  };
  onAction: (insight: InsightItem, actionType: string) => void;
}

export function CampaignInsightCard({ insight, onAction }: CampaignInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine icon based on severity
  const getSeverityIcon = () => {
    switch(insight.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Determine badge color based on severity
  const getSeverityBadgeClass = () => {
    switch(insight.severity) {
      case 'critical':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      case 'warning':
        return 'bg-warning/10 text-warning hover:bg-warning/20';
      default:
        return 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80';
    }
  };

  // Determine trend indicator for KPI
  const getTrendIndicator = () => {
    if (!insight.kpiData) return null;

    const { currentValue, previousValue } = insight.kpiData;
    const diff = ((currentValue - previousValue) / previousValue) * 100;
    
    // For metrics where higher is better (assuming ROAS, Conversion, etc.)
    const isHigherBetter = !insight.kpiData.metricName.includes('CPC') && 
                          !insight.kpiData.metricName.includes('cost');
    
    if (Math.abs(diff) < 1) {
      return (
        <span className="flex items-center text-muted-foreground">
          <Minus className="h-3 w-3 mr-1" />
          <span className="text-xs">No change</span>
        </span>
      );
    }
    
    if ((diff > 0 && isHigherBetter) || (diff < 0 && !isHigherBetter)) {
      return (
        <span className="flex items-center text-success">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span className="text-xs">{Math.abs(diff).toFixed(1)}% from last period</span>
        </span>
      );
    }
    
    return (
      <span className="flex items-center text-destructive">
        <TrendingDown className="h-3 w-3 mr-1" />
        <span className="text-xs">{Math.abs(diff).toFixed(1)}% from last period</span>
      </span>
    );
  };

  return (
    <Card className="w-full mb-4 overflow-hidden border-l-4" 
      style={{ 
        borderLeftColor: insight.severity === 'critical' ? 'var(--destructive)' : 
                         insight.severity === 'warning' ? 'var(--warning)' : 
                         'var(--border)' 
      }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {getSeverityIcon()}
            <CardTitle className="text-base">{insight.title}</CardTitle>
          </div>
          <Badge variant="outline" className={getSeverityBadgeClass()}>
            {insight.severity === 'critical' ? 'Critical' : 
             insight.severity === 'warning' ? 'Warning' : 'Info'}
          </Badge>
        </div>
        <CardDescription className="mt-1">{insight.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {insight.kpiData && (
          <div className="flex flex-col space-y-1 bg-muted/50 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{insight.kpiData.metricName}</span>
              {getTrendIndicator()}
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold">
                {insight.kpiData.currentValue}{insight.kpiData.unit}
              </span>
              <span className="text-sm text-muted-foreground">
                Target: {insight.kpiData.threshold}{insight.kpiData.unit}
              </span>
            </div>
          </div>
        )}
        
        {expanded && (
          <div className="mt-4 space-y-3">
            <div>
              <h4 className="font-medium mb-1 text-sm">Recommendation</h4>
              <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
            </div>
            
            {insight.implementationSteps && insight.implementationSteps.length > 0 && (
              <div>
                <h4 className="font-medium mb-1 text-sm">Implementation Steps</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {insight.implementationSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-normal"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show details
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAction(insight, insight.actionType || 'view')}
          className="text-xs gap-1"
        >
          {insight.actionLabel || 'Take Action'}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
} 