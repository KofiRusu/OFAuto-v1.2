"use client";

import { ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  trend?: "positive" | "negative" | "neutral";
  iconColor?: string;
  loading?: boolean;
  format?: "number" | "currency" | "percent";
}

export function StatCard({
  title,
  value,
  icon,
  change,
  trend = "neutral",
  iconColor = "blue",
  loading = false,
  format = "number",
}: StatCardProps) {
  const formattedValue = () => {
    if (loading) return "—";
    
    if (typeof value === "number") {
      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value);
        case "percent":
          return `${value}%`;
        default:
          return new Intl.NumberFormat("en-US").format(value);
      }
    }
    
    return value;
  };

  const trendColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  };

  const colorVariants = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between">
        <div className="mr-4">
          <div className="text-sm text-gray-500 font-medium">{title}</div>
          <div className="text-2xl font-bold mt-1">{formattedValue()}</div>
          
          {!loading && change !== undefined && (
            <div className={`flex items-center mt-1 text-sm ${trendColors[trend]}`}>
              {trend === "positive" && <ArrowUpIcon className="w-4 h-4 mr-1" />}
              {trend === "negative" && <ArrowDownIcon className="w-4 h-4 mr-1" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorVariants[iconColor as keyof typeof colorVariants]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
} 