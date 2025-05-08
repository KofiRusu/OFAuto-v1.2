'use client';

import { useState, useMemo } from 'react';
import { Campaign } from '@/hooks/useCampaigns';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface MetricsChartProps {
  campaigns: Campaign[];
}

// Define metric types and formatters
const metricOptions = [
  { value: 'impressions', label: 'Impressions', formatter: formatNumber },
  { value: 'clicks', label: 'Clicks', formatter: formatNumber },
  { value: 'conversions', label: 'Conversions', formatter: formatNumber },
  { value: 'ctr', label: 'CTR (%)', formatter: (val: number) => `${val.toFixed(2)}%` },
  { value: 'conversionRate', label: 'Conversion Rate (%)', formatter: (val: number) => `${val.toFixed(2)}%` },
  { value: 'roi', label: 'ROI (%)', formatter: (val: number) => `${val.toFixed(2)}%` },
  { value: 'revenue', label: 'Revenue', formatter: formatCurrency },
  { value: 'cost', label: 'Cost', formatter: formatCurrency },
];

// Colors for different platforms
const platformColors: Record<string, string> = {
  onlyfans: '#00AFF0',
  instagram: '#C13584',
  twitter: '#1DA1F2',
  facebook: '#4267B2',
  tiktok: '#000000',
  youtube: '#FF0000',
  default: '#6E56CF'
};

const MetricsChart = ({ campaigns }: MetricsChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [chartType, setChartType] = useState<'platform' | 'campaign'>('platform');

  // Get the selected metric configuration
  const metricConfig = metricOptions.find(m => m.value === selectedMetric) || metricOptions[0];

  // Process data for the chart based on the selected view
  const chartData = useMemo(() => {
    if (chartType === 'platform') {
      // Aggregate by platform
      const platformData: Record<string, Record<string, number>> = {};
      
      campaigns.forEach(campaign => {
        const platform = campaign.platform.toLowerCase();
        const metricValue = campaign.metrics?.[selectedMetric as keyof typeof campaign.metrics] as number || 0;
        
        if (!platformData[platform]) {
          platformData[platform] = { [selectedMetric]: 0 };
        }
        
        platformData[platform][selectedMetric] = (platformData[platform][selectedMetric] || 0) + metricValue;
      });
      
      return Object.entries(platformData).map(([platform, metrics]) => ({
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        [selectedMetric]: metrics[selectedMetric] || 0,
        color: platformColors[platform] || platformColors.default
      }));
    } else {
      // Show individual campaigns
      return campaigns
        .filter(campaign => campaign.metrics?.[selectedMetric as keyof typeof campaign.metrics])
        .sort((a, b) => {
          const valA = a.metrics?.[selectedMetric as keyof typeof a.metrics] as number || 0;
          const valB = b.metrics?.[selectedMetric as keyof typeof b.metrics] as number || 0;
          return valB - valA;
        })
        .slice(0, 10) // Limit to top 10 campaigns
        .map(campaign => ({
          name: campaign.name.length > 16 ? campaign.name.substring(0, 16) + '...' : campaign.name,
          [selectedMetric]: campaign.metrics?.[selectedMetric as keyof typeof campaign.metrics] as number || 0,
          color: platformColors[campaign.platform.toLowerCase()] || platformColors.default,
          platform: campaign.platform,
        }));
    }
  }, [campaigns, selectedMetric, chartType]);

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="bg-white p-2 shadow-lg border border-gray-200">
          <CardContent className="p-2">
            <p className="text-sm font-medium mb-1">{data.name}</p>
            {chartType === 'campaign' && (
              <p className="text-xs text-muted-foreground mb-1 capitalize">{data.platform}</p>
            )}
            <p className="text-sm">
              <span className="font-medium">{metricConfig.label}:</span>{' '}
              {metricConfig.formatter(data[selectedMetric])}
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex items-center justify-between">
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Select value={chartType} onValueChange={(value: 'platform' | 'campaign') => setChartType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="platform">By Platform</SelectItem>
              <SelectItem value="campaign">By Campaign</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
          No data available for the selected metric
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => {
                // Format large numbers for better display
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              dataKey={selectedMetric} 
              name={metricConfig.label} 
              fill="#6E56CF"
              radius={[4, 4, 0, 0]}
              barSize={chartType === 'platform' ? 60 : 30}
              // Use individual colors for the bars
              isAnimationActive={true}
              animationDuration={500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MetricsChart; 