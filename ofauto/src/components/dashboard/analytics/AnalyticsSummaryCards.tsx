import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, Percent, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line 
} from "recharts";

export interface AnalyticsSummary {
  totalFollowers: number;
  followersChangePercent: number;
  monthlyEarnings: number;
  earningsChangePercent: number;
  avgEngagementRate: number;
  engagementChangePercent: number;
  // Optional trend data for sparklines
  followersTrend?: { date: string; value: number }[];
  earningsTrend?: { date: string; value: number }[];
  engagementTrend?: { date: string; value: number }[];
}

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary | null;
  isLoading: boolean;
}

interface SummaryCardProps {
  title: string;
  value: number | string;
  countUpPrefix?: string;
  countUpSuffix?: string;
  countUpDecimals?: number;
  changePercent: number;
  icon: React.ReactNode;
  isLoading: boolean;
  trendData?: { date: string; value: number }[];
}

function SummaryCard({ 
  title, 
  value, 
  countUpPrefix = '', 
  countUpSuffix = '', 
  countUpDecimals = 0,
  changePercent, 
  icon, 
  isLoading,
  trendData = [] 
}: SummaryCardProps) {

  // Generate sample data if no trend data provided
  const sparklineData = trendData.length > 0 ? trendData : Array(10)
    .fill(0)
    .map((_, i) => ({ 
      date: `day-${i}`, 
      value: typeof value === 'number' 
        ? value * (0.85 + (Math.random() * 0.3)) 
        : Number(String(value).replace(/[^0-9.-]+/g, "")) * (0.85 + (Math.random() * 0.3))
    }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-6 w-6 rounded-sm" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-3/5 mb-1" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-10 w-full mt-3" />
        </CardContent>
      </Card>
    );
  }

  const numericValue = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));

  const ChangeIcon = changePercent > 0 ? ArrowUpRight : changePercent < 0 ? ArrowDownRight : Minus;
  const badgeVariant = changePercent > 0 ? "success" : changePercent < 0 ? "error" : "secondary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {countUpPrefix}
          <CountUp 
            end={numericValue} 
            decimals={countUpDecimals}
            duration={2}
            separator=","
          />
          {countUpSuffix}
        </div>
        
        <div className="flex items-center mt-1">
          <Badge variant={badgeVariant} className="mr-2">
            <ChangeIcon size={14} className="mr-1"/> 
            {Math.abs(changePercent).toFixed(1)}%
          </Badge>
          <p className="text-xs text-muted-foreground">from last period</p>
        </div>
        
        {/* Sparkline Chart */}
        <div className="h-10 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={changePercent >= 0 ? "#10b981" : "#ef4444"} 
                    stopOpacity={0.3} 
                  />
                  <stop 
                    offset="95%" 
                    stopColor={changePercent >= 0 ? "#10b981" : "#ef4444"} 
                    stopOpacity={0} 
                  />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={changePercent >= 0 ? "#10b981" : "#ef4444"} 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsSummaryCards({ summary, isLoading }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SummaryCard 
        title="Total Followers" 
        value={summary?.totalFollowers || 0}
        changePercent={summary?.followersChangePercent ?? 0}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        trendData={summary?.followersTrend}
      />
      <SummaryCard 
        title="Monthly Earnings" 
        value={summary?.monthlyEarnings || 0}
        countUpPrefix="$"
        countUpDecimals={2}
        changePercent={summary?.earningsChangePercent ?? 0}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        trendData={summary?.earningsTrend}
      />
      <SummaryCard 
        title="Avg. Engagement Rate" 
        value={summary?.avgEngagementRate || 0}
        countUpSuffix="%"
        countUpDecimals={1}
        changePercent={summary?.engagementChangePercent ?? 0}
        icon={<Percent className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
        trendData={summary?.engagementTrend}
      />
    </div>
  );
} 