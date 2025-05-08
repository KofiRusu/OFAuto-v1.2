'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { format, startOfYear, endOfMonth } from 'date-fns';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { UserRole } from '@prisma/client';
import { useUser } from '@clerk/nextjs';

// UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// UI components for charts
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function FinancialMonitorPage() {
  const router = useRouter();
  const { user } = useUser();
  
  // Get user role from Clerk metadata for feature flag
  const userRole = user?.publicMetadata?.role as UserRole | undefined;
  
  // Check if user is allowed to access this page
  const canAccessPage = useFeatureFlag(userRole, 'MANAGER_ANALYTICS');
  
  // Active tab
  const [activeTab, setActiveTab] = useState('summary');
  
  // Filter state
  const [filters, setFilters] = useState({
    userId: '',
    clientId: '',
    category: '',
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    groupBy: 'month' as 'day' | 'week' | 'month' | 'quarter' | 'year',
  });
  
  // Get users for filter dropdown
  const { data: usersData } = trpc.user.listUsers.useQuery(undefined, {
    enabled: !!canAccessPage,
  });
  
  // Get clients for filter dropdown
  const { data: clientsData } = trpc.client.list.useQuery(undefined, {
    enabled: !!canAccessPage,
  });
  
  // Query financial summary
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = trpc.financialMonitor.getFinancialSummary.useQuery(
    {
      startDate: filters.startDate,
      endDate: filters.endDate,
      userId: filters.userId || undefined,
      clientId: filters.clientId || undefined,
    },
    {
      enabled: !!canAccessPage && activeTab === 'summary',
    }
  );
  
  // Query financial trends
  const {
    data: trendsData,
    isLoading: isLoadingTrends,
    isError: isTrendsError,
    refetch: refetchTrends,
  } = trpc.financialMonitor.getFinancialTrends.useQuery(
    {
      ...filters,
      userId: filters.userId || undefined,
      clientId: filters.clientId || undefined,
      category: filters.category || undefined,
      startDate: filters.startDate,
      endDate: filters.endDate,
      groupBy: filters.groupBy,
      includeTrend: true,
      includeVariance: true,
    },
    {
      enabled: !!canAccessPage && activeTab === 'trends',
    }
  );
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Refetch data based on active tab
    if (tab === 'summary') {
      refetchSummary();
    } else if (tab === 'trends') {
      refetchTrends();
    }
  };
  
  // If user doesn't have access, show permission error
  if (!canAccessPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Permission Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the financial monitoring page.
              This feature is available only to managers and administrators.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Generate colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Financial Monitor</h1>
        <p className="text-muted-foreground">
          Track and analyze financial metrics and trends.
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <Select
                value={filters.userId}
                onValueChange={(value) => handleFilterChange('userId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {usersData?.users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <Select
                value={filters.clientId}
                onValueChange={(value) => handleFilterChange('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clientsData?.clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {format(filters.startDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange('startDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {format(filters.endDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange('endDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleFilterChange('startDate', startOfYear(new Date()));
                    handleFilterChange('endDate', new Date());
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          {isLoadingSummary ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : isSummaryError ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>
                  Failed to load financial summary. Please try again later.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => refetchSummary()} className="w-full">
                  Retry
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary Cards */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(summaryData?.summary?.totalRevenue || 0)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(summaryData?.summary?.totalExpenses || 0)}
                        </p>
                      </div>
                      <div className="col-span-2 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className={`text-3xl font-bold ${
                          (summaryData?.summary?.netProfit || 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(summaryData?.summary?.netProfit || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!summaryData?.summary?.topCategories?.length ? (
                      <p className="text-muted-foreground">No category data available.</p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summaryData.summary.topCategories}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${formatPercentage(percent * 100)})`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="amount"
                              nameKey="category"
                            >
                              {summaryData.summary.topCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Monthly Trend */}
              <Card className="md:row-span-2">
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {!summaryData?.summary?.monthlyTrend?.length ? (
                    <p className="text-muted-foreground">No trend data available.</p>
                  ) : (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={summaryData.summary.monthlyTrend}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#0088FE"
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            name="Expenses"
                            stroke="#FF8042"
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            name="Profit"
                            stroke="#00C49F"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Financial Trends</CardTitle>
              <CardDescription>
                View and analyze financial metrics with trend and variance calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="w-64">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-64">
                  <label className="block text-sm font-medium mb-1">Group By</label>
                  <Select
                    value={filters.groupBy}
                    onValueChange={(value) => handleFilterChange('groupBy', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="quarter">Quarter</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoadingTrends ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : isTrendsError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Failed to load financial trends. Please try again later.</p>
                  <Button onClick={() => refetchTrends()} className="mt-4">
                    Retry
                  </Button>
                </div>
              ) : !trendsData?.metrics?.length ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No financial data available for the selected filters.</p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendsData.metrics}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 
                          filters.groupBy === 'day' ? 'dd MMM' : 
                          filters.groupBy === 'month' ? 'MMM yyyy' : 
                          filters.groupBy === 'quarter' ? 'QQ yyyy' : 
                          'yyyy'
                        )} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'amount') return formatCurrency(value as number);
                          if (name === 'trend') return `${value}%`;
                          if (name === 'variance') return `${value}%`;
                          return value;
                        }}
                        labelFormatter={(date) => format(new Date(date as string), 'PPP')}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Amount" fill="#0088FE" />
                      <Bar dataKey="trend" name="Trend %" fill="#00C49F" />
                      <Bar dataKey="variance" name="Variance %" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 