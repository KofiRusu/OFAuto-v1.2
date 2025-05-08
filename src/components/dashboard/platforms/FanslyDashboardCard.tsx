'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface FanslyDashboardCardProps {
  totalSubscribers: number;
  monthlyIncome: number;
  lifetimeIncome: number;
  lastActivity?: { type: string; name?: string; amount?: number }; // e.g., last purchase/tip
  currencySymbol?: string;
  isLoading: boolean;
  error?: string;
}

export function FanslyDashboardCard({
  totalSubscribers,
  monthlyIncome,
  lifetimeIncome,
  lastActivity,
  currencySymbol = '$',
  isLoading,
  error,
}: FanslyDashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Fansly Stats</span>
          {/* Placeholder for Fansly logo */}
          <span className="text-2xl">✨</span> 
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p>Loading Fansly data...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Subscribers</span>
              <span>{totalSubscribers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Monthly Income</span>
              <span>{currencySymbol}{monthlyIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Lifetime Income</span>
              <span>{currencySymbol}{lifetimeIncome.toFixed(2)}</span>
            </div>
            {lastActivity && (
              <div className="pt-2 border-t mt-2 text-sm text-muted-foreground capitalize">
                Last: {lastActivity.type} {lastActivity.name ? `from ${lastActivity.name}` : ''} 
                {lastActivity.amount ? `(${currencySymbol}${lastActivity.amount.toFixed(2)})` : ''}
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href="https://fansly.com/messages" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">Open Fansly Inbox</Button>
        </Link>
         {/* Link to internal DM automation settings if available */}
        <Link href="/dashboard/automation/dm?platform=fansly" passHref>
          <Button variant="outline" size="sm">DM Settings</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 