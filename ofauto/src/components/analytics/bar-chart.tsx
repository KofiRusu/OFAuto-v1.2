"use client";

import { format } from "date-fns";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesData, TimeSeriesDataPoint } from "@/lib/analytics/types";

interface BarChartProps {
  data: TimeSeriesData[];
  title: string;
  height?: number;
  yAxisLabel?: string;
  loading?: boolean;
  emptyMessage?: string;
  period?: "daily" | "weekly" | "monthly";
  formatYAxis?: (value: number) => string;
  stacked?: boolean;
}

export function BarChart({
  data,
  title,
  height = 300,
  yAxisLabel,
  loading = false,
  emptyMessage = "No data available",
  period = "daily",
  formatYAxis = (value: number) => value.toString(),
  stacked = false,
}: BarChartProps) {
  const formatDate = (date: Date) => {
    switch (period) {
      case "daily":
        return format(new Date(date), "MMM d");
      case "weekly":
        return format(new Date(date), "MMM d");
      case "monthly":
        return format(new Date(date), "MMM yyyy");
    }
  };

  // Combine all datasets into a single array for Recharts
  const combinedData = data.length > 0
    ? data[0].data.map((point: TimeSeriesDataPoint) => {
        const obj: Record<string, any> = {
          date: point.date,
        };

        data.forEach((series) => {
          const matchingPoint = series.data.find(
            (p) => p.date.getTime() === point.date.getTime()
          );
          obj[series.label] = matchingPoint ? matchingPoint.value : 0;
        });

        return obj;
      })
    : [];

  // Color palette for bars
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#6366F1", // indigo
    "#EC4899", // pink
    "#8B5CF6", // purple
  ];

  // If loading or no data, show appropriate message
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data.length || !combinedData.length) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-gray-400">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => formatDate(new Date(date))}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: 12 },
                    }
                  : undefined
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatYAxis(value), name]}
              labelFormatter={(label) => formatDate(new Date(label as string))}
            />
            <Legend />
            {data.map((series, index) => (
              <Bar
                key={series.label}
                dataKey={series.label}
                fill={colors[index % colors.length]}
                stackId={stacked ? "a" : undefined}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 