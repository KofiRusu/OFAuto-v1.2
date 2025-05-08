'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3, TrendingUp, CreditCard, Download, Calendar, ArrowUpRight, Wallet, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

// Mock Revenue Chart Component 
const RevenueChartPlaceholder = () => (
  <div className="h-80 w-full border rounded-md flex items-center justify-center bg-gray-50">
    <div className="text-center text-gray-500">
      <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
      <p>Revenue chart visualization would appear here</p>
    </div>
  </div>
);

// Mock Platform Comparison Chart Component
const PlatformComparisonChartPlaceholder = () => (
  <div className="h-80 w-full border rounded-md flex items-center justify-center bg-gray-50">
    <div className="text-center text-gray-500">
      <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
      <p>Platform comparison chart would appear here</p>
    </div>
  </div>
);

// Mock ROI Chart Component
const ROIChartPlaceholder = () => (
  <div className="h-80 w-full border rounded-md flex items-center justify-center bg-gray-50">
    <div className="text-center text-gray-500">
      <TrendingUp className="h-10 w-10 mx-auto mb-2 text-gray-400" />
      <p>ROI chart visualization would appear here</p>
    </div>
  </div>
);

interface FinancialPerformanceSectionProps {
  clientId: string;
}

export default function FinancialPerformanceSection({ clientId }: FinancialPerformanceSectionProps) {
  const [timeRange, setTimeRange] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock financial data
  const financialOverview = {
    totalRevenue: "$15,782.45",
    revenueChange: "+12.8%",
    subscribers: 1245,
    subscriberChange: "+5.2%",
    avgRevenue: "$12.68",
    avgRevenueChange: "+7.4%",
    topPlatform: "OnlyFans",
    topPlatformRevenue: "$8,945.20"
  };
  
  // Mock transaction data
  const recentTransactions = [
    { id: 1, date: "2023-05-12", platform: "onlyfans", type: "subscription", amount: 15.99, status: "completed" },
    { id: 2, date: "2023-05-11", platform: "fansly", type: "tip", amount: 50.00, status: "completed" },
    { id: 3, date: "2023-05-10", platform: "patreon", type: "subscription", amount: 25.00, status: "completed" },
    { id: 4, date: "2023-05-09", platform: "onlyfans", type: "ppv", amount: 12.99, status: "completed" },
    { id: 5, date: "2023-05-08", platform: "kofi", type: "donation", amount: 5.00, status: "completed" },
  ];
  
  // Mock ad spend data
  const adSpendData = [
    { id: 1, campaign: "Spring Promotion", platform: "Instagram", spend: 250.00, reach: 15400, conversions: 42, roi: "+168%" },
    { id: 2, campaign: "New Content Launch", platform: "TikTok", spend: 180.00, reach: 22800, conversions: 38, roi: "+210%" },
    { id: 3, campaign: "Exclusive Membership", platform: "Twitter", spend: 120.00, reach: 8900, conversions: 15, roi: "+75%" },
    { id: 4, campaign: "Platform Cross-Promotion", platform: "Multiple", spend: 350.00, reach: 27500, conversions: 68, roi: "+194%" },
  ];
  
  // Mock platform revenue data
  const platformRevenueData = [
    { platform: "OnlyFans", revenue: 8945.20, percentage: 56.7, change: "+15.2%" },
    { platform: "Fansly", revenue: 3542.85, percentage: 22.4, change: "+8.7%" },
    { platform: "Patreon", revenue: 2687.40, percentage: 17.0, change: "+11.4%" },
    { platform: "Ko-fi", revenue: 607.00, percentage: 3.9, change: "+22.5%" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      onlyfans: "bg-blue-100 text-blue-800",
      fansly: "bg-purple-100 text-purple-800",
      patreon: "bg-orange-100 text-orange-800",
      kofi: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={colors[platform] || "bg-gray-100 text-gray-800"}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      subscription: "bg-green-100 text-green-800",
      tip: "bg-purple-100 text-purple-800",
      ppv: "bg-blue-100 text-blue-800",
      donation: "bg-amber-100 text-amber-800",
    };
    
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <DollarSign className="mr-2 h-5 w-5" /> Financial Performance
        </CardTitle>
        <CardDescription>
          Track revenue, analyze monetization strategies, and calculate ROI across platforms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
        
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{financialOverview.totalRevenue}</div>
                <Badge className="bg-green-100 text-green-800">
                  <TrendingUp className="mr-1 h-3 w-3" /> {financialOverview.revenueChange}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{financialOverview.subscribers}</div>
                <Badge className="bg-green-100 text-green-800">
                  <TrendingUp className="mr-1 h-3 w-3" /> {financialOverview.subscriberChange}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Avg. Revenue per User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{financialOverview.avgRevenue}</div>
                <Badge className="bg-green-100 text-green-800">
                  <TrendingUp className="mr-1 h-3 w-3" /> {financialOverview.avgRevenueChange}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Top Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">{financialOverview.topPlatform}</div>
                <div className="text-sm text-gray-500">{financialOverview.topPlatformRevenue}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <CreditCard className="mr-2 h-4 w-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="adspend">
              <Wallet className="mr-2 h-4 w-4" /> Ad Spend & ROI
            </TabsTrigger>
            <TabsTrigger value="platforms">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Platform Comparison
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <h3 className="text-lg font-medium">Revenue Over Time</h3>
            <RevenueChartPlaceholder />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Revenue by Platform</h3>
                <div className="space-y-4">
                  {platformRevenueData.map((item) => (
                    <div key={item.platform} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.platform}</span>
                        <span className="font-medium">{formatCurrency(item.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-100 rounded-full flex-1">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{item.percentage}%</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {item.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Revenue by Content Type</h3>
                <div className="h-64 w-full border rounded-md flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Content type breakdown chart would appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Recent Transactions</h3>
              <div className="flex space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="onlyfans">OnlyFans</SelectItem>
                    <SelectItem value="fansly">Fansly</SelectItem>
                    <SelectItem value="patreon">Patreon</SelectItem>
                    <SelectItem value="kofi">Ko-fi</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription">Subscriptions</SelectItem>
                    <SelectItem value="tip">Tips</SelectItem>
                    <SelectItem value="ppv">Pay-per-view</SelectItem>
                    <SelectItem value="donation">Donations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{getPlatformBadge(transaction.platform)}</TableCell>
                      <TableCell>{getTransactionTypeBadge(transaction.type)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Showing 5 of 125 transactions</p>
              <Button variant="outline" size="sm">View All Transactions</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Subscription Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$10,892.45</div>
                  <p className="text-sm text-gray-500">69% of total revenue</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Tips & Donations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$3,245.00</div>
                  <p className="text-sm text-gray-500">21% of total revenue</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Pay-per-view Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$1,645.00</div>
                  <p className="text-sm text-gray-500">10% of total revenue</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Ad Spend & ROI Tab */}
          <TabsContent value="adspend" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Ad Campaign Performance</h3>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" /> Schedule New Campaign
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Reach</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adSpendData.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign}</TableCell>
                      <TableCell>{campaign.platform}</TableCell>
                      <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                      <TableCell>{campaign.reach.toLocaleString()}</TableCell>
                      <TableCell>{campaign.conversions}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {campaign.roi}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">ROI by Campaign</h3>
                <ROIChartPlaceholder />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Ad Spend vs. Revenue</h3>
                <div className="h-80 w-full border rounded-md flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Ad spend vs. revenue chart would appear here</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Total Ad Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(900)}</div>
                  <p className="text-sm text-gray-500">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Average CPA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(5.52)}</div>
                  <p className="text-sm text-gray-500">Cost per acquisition</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Overall ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+172%</div>
                  <p className="text-sm text-gray-500">Return on investment</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Platform Comparison Tab */}
          <TabsContent value="platforms" className="space-y-6">
            <h3 className="text-lg font-medium">Platform Performance Comparison</h3>
            <PlatformComparisonChartPlaceholder />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Subscriber Growth by Platform</h3>
                <div className="h-64 w-full border rounded-md flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Subscriber growth chart would appear here</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Average Revenue per Platform</h3>
                <div className="h-64 w-full border rounded-md flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Average revenue chart would appear here</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Active Subscribers</TableHead>
                    <TableHead>Avg. Revenue per Sub</TableHead>
                    <TableHead>Growth (MoM)</TableHead>
                    <TableHead>Churn Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">OnlyFans</TableCell>
                    <TableCell>{formatCurrency(8945.20)}</TableCell>
                    <TableCell>752</TableCell>
                    <TableCell>{formatCurrency(11.89)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">+15.2%</Badge>
                    </TableCell>
                    <TableCell>4.8%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fansly</TableCell>
                    <TableCell>{formatCurrency(3542.85)}</TableCell>
                    <TableCell>298</TableCell>
                    <TableCell>{formatCurrency(11.89)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">+8.7%</Badge>
                    </TableCell>
                    <TableCell>5.2%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Patreon</TableCell>
                    <TableCell>{formatCurrency(2687.40)}</TableCell>
                    <TableCell>164</TableCell>
                    <TableCell>{formatCurrency(16.39)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">+11.4%</Badge>
                    </TableCell>
                    <TableCell>3.1%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ko-fi</TableCell>
                    <TableCell>{formatCurrency(607.00)}</TableCell>
                    <TableCell>31</TableCell>
                    <TableCell>{formatCurrency(19.58)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">+22.5%</Badge>
                    </TableCell>
                    <TableCell>2.8%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Download Financial Report
        </Button>
      </CardFooter>
    </Card>
  );
} 