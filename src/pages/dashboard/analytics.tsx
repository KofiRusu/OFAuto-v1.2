import React, { useState, useEffect } from "react";
import { Shell } from "@/src/components/Shell";
import { KPICard } from "@/src/components/KPICard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { AlertCircle, ArrowRight, CheckCircle, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { InsightWithAction } from "@/src/lib/orchestration/insightsManager";
import { useInsights } from "@/src/hooks/useInsights";

// Mock data for charts
const performanceData = [
  { name: "Jan", revenue: 4000, spend: 2400, profit: 1600 },
  { name: "Feb", revenue: 3000, spend: 1398, profit: 1602 },
  { name: "Mar", revenue: 2000, spend: 9800, profit: -7800 },
  { name: "Apr", revenue: 2780, spend: 3908, profit: -1128 },
  { name: "May", revenue: 1890, spend: 4800, profit: -2910 },
  { name: "Jun", revenue: 2390, spend: 3800, profit: -1410 },
  { name: "Jul", revenue: 3490, spend: 4300, profit: -810 },
  { name: "Aug", revenue: 5490, spend: 3300, profit: 2190 },
  { name: "Sep", revenue: 7490, spend: 3800, profit: 3690 },
  { name: "Oct", revenue: 8490, spend: 4300, profit: 4190 },
  { name: "Nov", revenue: 9290, spend: 4400, profit: 4890 },
  { name: "Dec", revenue: 12490, spend: 5300, profit: 7190 },
];

const campaignData = [
  { name: "Campaign A", conversions: 120, spend: 4800, cpa: 40 },
  { name: "Campaign B", conversions: 280, spend: 5600, cpa: 20 },
  { name: "Campaign C", conversions: 160, spend: 6400, cpa: 40 },
  { name: "Campaign D", conversions: 340, spend: 5100, cpa: 15 },
  { name: "Campaign E", conversions: 90, spend: 4500, cpa: 50 },
];

export default function AnalyticsDashboard() {
  const { insights, selectedInsight, setSelectedInsight, applyInsightAction, dismissInsight, refreshInsights, isLoading } = useInsights();
  
  const getSeverityColor = (severity) => {
    switch(severity) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-amber-100 text-amber-800";
      case "low": return "bg-blue-100 text-blue-800";
      case "positive": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case "high": return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "medium": return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "low": return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case "positive": return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Shell>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            Overview of your campaign performance metrics and KPIs
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Revenue"
                value="$58,630"
                prefix=""
                delta={12.5}
                description="vs. last period"
                trend={[35, 40, 45, 40, 45, 55, 50, 60, 58, 65]}
                tooltipContent="Total revenue generated across all campaigns"
                colorScheme="default"
              />
              
              <KPICard
                title="ROAS"
                value={2.4}
                suffix="x"
                delta={-0.6}
                description="vs. last period"
                trend={[3.2, 3.1, 2.9, 2.8, 2.7, 2.5, 2.6, 2.4]}
                tooltipContent="Return on ad spend (Revenue/Spend)"
                colorScheme="warning"
              />
              
              <KPICard
                title="Conversions"
                value="1,284"
                delta={8.2}
                description="vs. last period"
                trend={[980, 1020, 1100, 1150, 1180, 1210, 1250, 1284]}
                tooltipContent="Total conversion events"
                colorScheme="success"
              />
              
              <KPICard
                title="CPA"
                prefix="$"
                value={24.85}
                delta={-4.2}
                description="vs. last period"
                trend={[30, 29, 28, 27, 26, 25.5, 25, 24.85]}
                tooltipContent="Cost per acquisition"
                colorScheme="success"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs. Spend</CardTitle>
                <CardDescription>Monthly performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="spend" fill="#ef4444" name="Spend" />
                      <Bar dataKey="profit" fill="#22c55e" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                  <CardDescription>Based on CPA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignData
                      .sort((a, b) => a.cpa - b.cpa)
                      .slice(0, 3)
                      .map((campaign, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.conversions} conversions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${campaign.cpa}</p>
                            <p className="text-sm text-muted-foreground">CPA</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Trend</CardTitle>
                  <CardDescription>Last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          yAxisId={0}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Active Campaigns"
                value={12}
                delta={2}
                description="vs. last period"
                tooltipContent="Number of currently active campaigns"
              />
              
              <KPICard
                title="CTR"
                value={3.2}
                suffix="%"
                delta={0.4}
                description="vs. last period"
                trend={[2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2]}
                tooltipContent="Click-through rate across all campaigns"
                colorScheme="success"
              />
              
              <KPICard
                title="CPM"
                prefix="$"
                value={18.45}
                delta={-2.3}
                description="vs. last period"
                trend={[22, 21, 20, 19.5, 19, 18.7, 18.45]}
                tooltipContent="Cost per thousand impressions"
                colorScheme="success"
              />
              
              <KPICard
                title="Avg. Budget"
                prefix="$"
                value="4,250"
                delta={5.8}
                description="vs. last period"
                trend={[3800, 3900, 4000, 4100, 4150, 4200, 4250]}
                tooltipContent="Average campaign budget"
                colorScheme="info"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Conversions vs. Spend by Campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaignData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="conversions" fill="#3b82f6" name="Conversions" />
                      <Bar dataKey="spend" fill="#ef4444" name="Spend ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="YTD Revenue"
                value="$264,580"
                delta={18.3}
                description="vs. previous year"
                trend={[210000, 225000, 240000, 255000, 264580]}
                tooltipContent="Year-to-date revenue"
                colorScheme="success"
              />
              
              <KPICard
                title="YTD ROAS"
                value={2.8}
                suffix="x"
                delta={0.3}
                description="vs. previous year"
                trend={[2.4, 2.5, 2.6, 2.7, 2.8]}
                tooltipContent="Year-to-date return on ad spend"
                colorScheme="success"
              />
              
              <KPICard
                title="MoM Growth"
                value={8.4}
                suffix="%"
                delta={-2.1}
                description="vs. previous month"
                trend={[12, 11, 10, 9, 8.4]}
                tooltipContent="Month-over-month revenue growth"
                colorScheme="warning"
              />
              
              <KPICard
                title="Profit Margin"
                value={24.8}
                suffix="%"
                delta={1.2}
                description="vs. previous year"
                trend={[22, 22.5, 23, 24, 24.8]}
                tooltipContent="Overall profit margin"
                colorScheme="info"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue for the past year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="profit" stroke="#22c55e" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">AI-Generated Insights</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshInsights}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                Refresh Insights
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Actionable insights generated by our AI analysis engine based on your campaign performance
                </p>
                
                <div className="space-y-3">
                  {insights.length === 0 ? (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-muted-foreground text-sm">No insights available.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    insights.map((insight) => (
                      <Card 
                        key={insight.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${selectedInsight?.id === insight.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedInsight(insight)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(insight.severity)}
                            <div>
                              <h4 className="font-medium text-sm">{insight.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {insight.timestamp ? new Date(insight.timestamp).toLocaleDateString() : 'N/A'}
                                {insight.actionApplied && (
                                  <span className="ml-2 text-green-600">• Action Applied</span>
                                )}
                                {insight.dismissed && (
                                  <span className="ml-2 text-muted-foreground">• Dismissed</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2">
                {selectedInsight ? (
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedInsight.title}</CardTitle>
                          <CardDescription>
                            {selectedInsight.description}
                          </CardDescription>
                        </div>
                        <Badge className={getSeverityColor(selectedInsight.severity)}>
                          {selectedInsight.severity?.charAt(0).toUpperCase() + selectedInsight.severity?.slice(1)} Priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {selectedInsight.metrics && Object.entries(selectedInsight.metrics).map(([key, value], i) => (
                              <div key={i} className="bg-muted p-3 rounded-md">
                                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-lg font-medium">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {selectedInsight.recommendedAction && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Recommendation</h4>
                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                              <div className="flex gap-3">
                                {selectedInsight.severity === "positive" ? (
                                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
                                )}
                                <p>{selectedInsight.recommendedAction.description}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedInsight.actionApplied && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                            <div className="flex gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <div>
                                <p className="font-medium">Action Applied</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedInsight.actionType} • 
                                  {selectedInsight.actionTimestamp ? 
                                    new Date(selectedInsight.actionTimestamp).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex justify-between w-full">
                        <Button 
                          variant="outline" 
                          onClick={() => dismissInsight(selectedInsight.id)}
                          disabled={selectedInsight.dismissed || selectedInsight.actionApplied}
                        >
                          {selectedInsight.dismissed ? 'Dismissed' : 'Dismiss'}
                        </Button>
                        {selectedInsight.recommendedAction && !selectedInsight.actionApplied && !selectedInsight.dismissed && (
                          <Button 
                            onClick={() => applyInsightAction(
                              selectedInsight.id, 
                              selectedInsight.recommendedAction?.type
                            )}
                          >
                            Apply Recommendation
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Select an insight to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {selectedInsight && selectedInsight.campaignId && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Performance Data</CardTitle>
                  <CardDescription>
                    Historical performance for Campaign {selectedInsight.campaignId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          activeDot={{ r: 8 }}
                        />
                        {selectedInsight.type === "performance" && (
                          <Line type="monotone" dataKey="profit" stroke="#22c55e" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
} 