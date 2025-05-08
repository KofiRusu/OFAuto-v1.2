'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface OnlyFansDashboardCardProps {
  activeSubs: number;
  monthlyEarnings: number;
  tipsCount?: number; // Optional
  currencySymbol?: string;
  isLoading: boolean;
  error?: string;
}

export function OnlyFansDashboardCard({
  activeSubs,
  monthlyEarnings,
  tipsCount,
  currencySymbol = '$',
  isLoading,
  error,
}: OnlyFansDashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>OnlyFans Stats</span>
          {/* Placeholder for OnlyFans logo */}
          <span className="text-2xl text-blue-500">🧿</span> 
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p>Loading OnlyFans data...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Subscribers</span>
              <span>{activeSubs}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Monthly Earnings</span>
              <span>{currencySymbol}{monthlyEarnings.toFixed(2)}</span>
            </div>
            {tipsCount !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tips Received (Monthly)</span>
                <span>{tipsCount}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
         {/* Link to internal DM automation settings */}
         <Link href="/dashboard/automation/dm?platform=onlyfans" passHref>
           <Button variant="outline" size="sm">DM Automation</Button>
         </Link>
         {/* Optionally link to OF site */}
         <Link href="https://onlyfans.com/my/dashboard" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">Open OF</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 