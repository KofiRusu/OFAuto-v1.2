'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface KofiDashboardCardProps {
  monthlyDonations: number;
  totalSupporters: number;
  lifetimeEarnings: number;
  lastSupporterName?: string;
  lastSupporterAmount?: number;
  currencySymbol?: string;
  isLoading: boolean;
  error?: string;
}

export function KofiDashboardCard({
  monthlyDonations,
  totalSupporters,
  lifetimeEarnings,
  lastSupporterName,
  lastSupporterAmount,
  currencySymbol = '$',
  isLoading,
  error,
}: KofiDashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ko-fi Stats</span>
          {/* Placeholder for Ko-fi logo or icon */}
          <span className="text-2xl">☕</span> 
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p>Loading Ko-fi data...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Donations (30d)</span>
              <span>{currencySymbol}{monthlyDonations.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Supporters</span>
              <span>{totalSupporters}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lifetime Earnings</span>
              <span>{currencySymbol}{lifetimeEarnings.toFixed(2)}</span>
            </div>
            {lastSupporterName && (
              <div className="pt-2 border-t mt-2 text-sm text-muted-foreground">
                Last: {lastSupporterName} ({currencySymbol}{lastSupporterAmount?.toFixed(2)})
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
         {/* Link might need adjustment based on actual activity feed route */}
        <Link href="/dashboard/activity?platform=kofi" passHref>
          <Button variant="outline" size="sm">View Supporters</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 