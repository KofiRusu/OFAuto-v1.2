'use client';

import { 
    ResponsiveContainer, 
    LineChart, Line, 
    BarChart, Bar, 
    PieChart, Pie, Cell, Legend, Tooltip,
    XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from 'lucide-react';

export interface ChartData {
    earnings: { date: string; value: number }[];
    followers: { date: string; value: number }[];
    engagementBreakdown: { label: string; value: number }[];
    revenueDistribution: { label: string; value: number }[];
}

interface AnalyticsChartPanelProps {
  chartData: ChartData | null;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded shadow-sm px-3 py-2 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((pld: any, index: number) => (
           <p key={index} style={{ color: pld.color }}>
               {pld.name}: {pld.value.toLocaleString(undefined, pld.name.toLowerCase().includes('earnings') ? { style: 'currency', currency: 'USD' } : {})}
           </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsChartPanel({ chartData, isLoading }: AnalyticsChartPanelProps) {

  const renderChart = (chartType: keyof ChartData, title: string, description?: string) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
             <Skeleton className="h-5 w-2/5" />
             {description && <Skeleton className="h-3 w-3/5 mt-1" />}
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      );
    }
    
    if (!chartData || !chartData[chartType] || (Array.isArray(chartData[chartType]) && chartData[chartType].length === 0)) {
       return (
        <Card className="flex flex-col items-center justify-center h-64">
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <CardTitle className="text-base font-medium">Not Enough Data</CardTitle>
                {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </CardHeader>
        </Card>
       );
    }

    let chartComponent;
    const data = chartData[chartType];

    switch (chartType) {
      case 'earnings':
      case 'followers':
        chartComponent = (
          <LineChart data={data as any[]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))"/>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => chartType === 'earnings' ? `$${value / 1000}k` : value.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Line type="monotone" dataKey="value" name={chartType === 'earnings' ? 'Earnings' : 'Followers'} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        );
        break;
      case 'engagementBreakdown':
         chartComponent = (
          <BarChart data={data as any[]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))"/>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
        break;
      case 'revenueDistribution':
         chartComponent = (
            <PieChart>
                <Pie
                    data={data as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="label"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                            {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                >
                    {(data as any[]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
            </PieChart>
        );
        break;
      default:
        chartComponent = <p>Unsupported chart type</p>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartComponent}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {renderChart('earnings', 'Earnings Over Time')}
        {renderChart('followers', 'Follower Growth')}
        {renderChart('engagementBreakdown', 'Engagement Breakdown', 'Likes, comments, shares etc.')}
        {renderChart('revenueDistribution', 'Revenue Distribution', 'Tips vs Subs vs DMs')}
    </div>
  );
} 