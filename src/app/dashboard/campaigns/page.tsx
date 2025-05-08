"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, SortDesc, MoreHorizontal, Play, Pause, Copy, Pencil, Trash, User, Clock, MessageSquare, RefreshCw, AlertCircle, PlusCircle, BarChart3, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { AutoDMCampaignCard } from "@/components/campaigns/auto-dm-campaign-card";
import { CreateOrEditDMCampaignModal } from "@/components/campaigns/create-or-edit-dm-campaign-modal";
import { AutoDMCampaignStatus } from "@prisma/client";
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import CampaignModal from '@/components/campaigns/campaign-modal';
import MetricsChart from '@/components/campaigns/metrics-chart';
import { Campaign } from '@/hooks/useCampaigns';
import Link from 'next/link';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { addDays, format } from 'date-fns';

// Mock data for campaigns
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'New Subscriber Welcome',
    description: 'Automatically send a welcome message to new subscribers',
    status: 'active',
    triggerType: 'new_subscriber',
    platform: 'onlyfans',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    stats: {
      sent: 450,
      opened: 382,
      replied: 124,
      conversion: 27.5
    }
  },
  {
    id: '2',
    name: 'Re-engagement Campaign',
    description: 'Send follow-up to subscribers who haven\'t engaged in 14 days',
    status: 'active',
    triggerType: 'inactivity',
    platform: 'fansly',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    stats: {
      sent: 215,
      opened: 158,
      replied: 42,
      conversion: 19.5
    }
  },
  {
    id: '3',
    name: 'Subscription Renewal Reminder',
    description: 'Remind subscribers 3 days before their subscription expires',
    status: 'paused',
    triggerType: 'renewal',
    platform: 'onlyfans',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    stats: {
      sent: 120,
      opened: 98,
      replied: 32,
      conversion: 26.7
    }
  },
  {
    id: '4',
    name: 'Content Promotion',
    description: 'Notify followers about new exclusive content',
    status: 'draft',
    triggerType: 'manual',
    platform: 'twitter',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    stats: {
      sent: 0,
      opened: 0,
      replied: 0,
      conversion: 0
    }
  },
  {
    id: '5',
    name: 'Special Offer',
    description: 'Limited time discount for inactive subscribers',
    status: 'completed',
    triggerType: 'segment',
    platform: 'onlyfans',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    stats: {
      sent: 850,
      opened: 742,
      replied: 320,
      conversion: 37.6
    }
  }
];

// Platform mapping for display
const PLATFORMS = {
  onlyfans: { name: 'OnlyFans', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  fansly: { name: 'Fansly', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  instagram: { name: 'Instagram', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  twitter: { name: 'Twitter', color: 'bg-sky-100 text-sky-800 border-sky-200' }
};

// Trigger type mapping
const TRIGGER_TYPES = {
  new_subscriber: { name: 'New Subscriber', icon: <User className="h-4 w-4" /> },
  renewal: { name: 'Subscription Renewal', icon: <Clock className="h-4 w-4" /> },
  inactivity: { name: 'Inactivity', icon: <Pause className="h-4 w-4" /> },
  segment: { name: 'Segment', icon: <Filter className="h-4 w-4" /> },
  manual: { name: 'Manual', icon: <Play className="h-4 w-4" /> }
};

// Campaign status badge component
const CampaignStatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { color: string; label: string }> = {
    'draft': { color: 'bg-slate-200 text-slate-800', label: 'Draft' },
    'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
    'paused': { color: 'bg-amber-100 text-amber-800', label: 'Paused' },
    'completed': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
    'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' }
  };

  const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <Badge className={`${color} font-medium`}>
      {label}
    </Badge>
  );
};

export default function CampaignsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<{ id: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState('all');
  
  // Hooks for data fetching
  const { clients } = useClients();
  const { 
    campaigns, 
    isLoading, 
    filters, 
    updateFilters, 
    resetFilters,
    createCampaign,
    updateCampaign,
    deleteCampaign
  } = useCampaigns({
    fromDate: dateRange.from.toISOString(),
    toDate: dateRange.to.toISOString()
  });

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Handle modal actions
  const handleCreateSuccess = () => {
    setIsCreating(false);
    utils.autoDM.getAll.invalidate();
    toast({
      title: "Campaign created",
      description: "Your DM campaign has been created successfully",
    });
  };

  const handleUpdateSuccess = () => {
    setEditingCampaign(null);
    utils.autoDM.getAll.invalidate();
    toast({
      title: "Campaign updated",
      description: "Your DM campaign has been updated successfully",
    });
  };

  const handleDeleteSuccess = () => {
    utils.autoDM.getAll.invalidate();
    toast({
      title: "Campaign deleted",
      description: "The DM campaign has been deleted",
    });
  };

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
    { value: "COMPLETED", label: "Completed" },
    { value: "FAILED", label: "Failed" },
  ];

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateFilters({ search: value });
  };

  // Handle date range change
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    updateFilters({
      fromDate: range.from.toISOString(),
      toDate: range.to.toISOString()
    });
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setActiveTab(status);
    updateFilters({ status: status === 'all' ? undefined : status });
  };

  // Handle client filter
  const handleClientFilter = (clientId: string) => {
    updateFilters({ clientId: clientId === 'all' ? undefined : clientId });
  };

  // Handle platform filter
  const handlePlatformFilter = (platform: string) => {
    updateFilters({ platform: platform === 'all' ? undefined : platform });
  };

  // Handle create/edit campaign
  const handleOpenModal = (campaign?: Campaign) => {
    setSelectedCampaign(campaign || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCampaign(null);
    setIsModalOpen(false);
  };

  const handleSaveCampaign = async (data: any) => {
    try {
      if (selectedCampaign) {
        await updateCampaign.mutateAsync({ id: selectedCampaign.id, ...data });
      } else {
        await createCampaign.mutateAsync(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id);
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Define table columns
  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: 'name',
      header: 'Campaign Name',
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="font-medium">
            <Link 
              href={`/dashboard/campaigns/${campaign.id}`}
              className="hover:underline"
            >
              {campaign.name}
            </Link>
            {campaign.abTest && (
              <Badge variant="outline" className="ml-2 text-xs">
                {campaign.abTestVariant || 'A/B Test'}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => (
        <div className="capitalize">
          {row.original.platform}
        </div>
      )
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => formatCurrency(row.original.budget)
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />
    },
    {
      accessorKey: 'metrics.impressions',
      header: 'Impressions',
      cell: ({ row }) => formatNumber(row.original.metrics?.impressions || 0)
    },
    {
      accessorKey: 'metrics.clicks',
      header: 'Clicks',
      cell: ({ row }) => formatNumber(row.original.metrics?.clicks || 0)
    },
    {
      accessorKey: 'metrics.ctr',
      header: 'CTR',
      cell: ({ row }) => {
        const ctr = row.original.metrics?.ctr || 0;
        return `${ctr.toFixed(2)}%`;
      }
    },
    {
      accessorKey: 'metrics.conversions',
      header: 'Conversions',
      cell: ({ row }) => formatNumber(row.original.metrics?.conversions || 0)
    },
    {
      accessorKey: 'metrics.roi',
      header: 'ROI',
      cell: ({ row }) => {
        const roi = row.original.metrics?.roi || 0;
        return `${roi.toFixed(2)}%`;
      }
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => formatDate(row.original.startDate)
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => formatDate(row.original.endDate)
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            handleOpenModal(row.original);
          }}
        >
          Edit
        </Button>
      )
    }
  ];

  // Calculate metrics summaries
  const calculateMetricSummary = () => {
    if (!campaigns.length) return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalBudget: 0,
      totalImpressions: 0,
      totalClicks: 0,
      avgCTR: 0,
      totalConversions: 0,
      avgROI: 0
    };

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
    
    const campaignsWithROI = campaigns.filter(c => c.metrics?.roi !== undefined);
    const avgROI = campaignsWithROI.length 
      ? campaignsWithROI.reduce((sum, c) => sum + (c.metrics?.roi || 0), 0) / campaignsWithROI.length 
      : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalBudget,
      totalImpressions,
      totalClicks,
      avgCTR,
      totalConversions,
      avgROI
    };
  };

  const metrics = calculateMetricSummary();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-DM Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your automated direct messaging campaigns.
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            title="Refresh campaigns"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load campaigns: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="h-[220px] rounded-md border-2 border-muted animate-pulse bg-muted/20"
            />
          ))}
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <AutoDMCampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => setEditingCampaign({ id: campaign.id })}
              onDelete={handleDeleteSuccess}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-8 text-center">
          <h3 className="font-medium text-lg mb-2">No campaigns found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {statusFilter !== "all" 
              ? `You don't have any campaigns with the "${statusOptions.find(o => o.value === statusFilter)?.label}" status.` 
              : "You haven't created any campaigns yet."}
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Campaign
          </Button>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreating && (
        <CreateOrEditDMCampaignModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <CreateOrEditDMCampaignModal
          isOpen={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSuccess={handleUpdateSuccess}
          campaignId={editingCampaign.id}
        />
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                metrics.totalCampaigns
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeCampaigns} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(metrics.totalBudget)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For all campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${metrics.avgCTR.toFixed(2)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(metrics.totalClicks)} clicks / {formatNumber(metrics.totalImpressions)} impressions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${metrics.avgROI.toFixed(2)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(metrics.totalConversions)} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Performance</CardTitle>
            <div className="flex gap-3">
              <Select defaultValue="impressions">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="impressions">Impressions</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                  <SelectItem value="roi">ROI</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker 
                date={dateRange}
                onSelect={handleDateRangeChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2" />
                <p>No campaign data available for the selected filters</p>
              </div>
            ) : (
              <MetricsChart campaigns={campaigns} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Select defaultValue={filters.clientId || 'all'} onValueChange={handleClientFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={filters.platform || 'all'} onValueChange={handlePlatformFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="onlyfans">OnlyFans</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={resetFilters} title="Reset filters">
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" size="icon" className="md:hidden" title="Filter">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleStatusFilter}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">
                All
              </TabsTrigger>
              <TabsTrigger value="active">
                Active
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft
              </TabsTrigger>
              <TabsTrigger value="paused">
                Paused
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-80 w-full" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-2" />
              <p>No campaigns found matching your filters</p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={campaigns}
              filterColumn="name"
              filterValue={searchTerm}
              defaultSort={{ column: 'createdAt', direction: 'desc' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCampaign}
        onDelete={handleDeleteCampaign}
        campaign={selectedCampaign}
      />
    </div>
  );
}

// CampaignCard Component
function CampaignCard({ campaign, onDelete, onDuplicate, onEdit, onToggleStatus, getStatusBadge }) {
  const canToggleStatus = campaign.status === 'active' || campaign.status === 'paused'
  const isActive = campaign.status === 'active'
  
  // Platform badge
  const getPlatformBadge = (platform) => {
    return (
      <Badge 
        variant="outline" 
        className={PLATFORMS[platform]?.color || "bg-gray-100 text-gray-800"}>
        {PLATFORMS[platform]?.name || platform}
      </Badge>
    )
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {campaign.name}
              {getStatusBadge(campaign.status)}
            </CardTitle>
            <CardDescription className="mt-1">{campaign.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(campaign.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              
              {canToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(campaign.id)}>
                  {isActive ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onDuplicate(campaign.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600" 
                onClick={() => onDelete(campaign.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPlatformBadge(campaign.platform)}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                {TRIGGER_TYPES[campaign.triggerType]?.icon}
                <span>{TRIGGER_TYPES[campaign.triggerType]?.name || campaign.triggerType}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created {format(parseISO(campaign.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
          
          {campaign.status !== 'draft' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Messages Sent</p>
                <p className="font-semibold">{campaign.stats.sent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Opened</p>
                <p className="font-semibold">
                  {campaign.stats.opened.toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round(campaign.stats.opened / campaign.stats.sent * 100)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500">Replied</p>
                <p className="font-semibold">
                  {campaign.stats.replied.toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round(campaign.stats.replied / campaign.stats.sent * 100)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500">Conversion Rate</p>
                <p className="font-semibold">{campaign.stats.conversion}%</p>
              </div>
            </div>
          )}
          
          {campaign.status === 'draft' && (
            <div className="text-sm text-gray-500 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Draft campaign - edit to configure triggers and messages
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(campaign.id)}
        >
          View Details
        </Button>
        
        {canToggleStatus && (
          <Button 
            variant={isActive ? "outline" : "default"} 
            size="sm"
            onClick={() => onToggleStatus(campaign.id)}
          >
            {isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Campaign
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate Campaign
              </>
            )}
          </Button>
        )}
        
        {campaign.status === 'draft' && (
          <Button 
            size="sm"
            onClick={() => onEdit(campaign.id)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Campaign
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Empty state when no campaigns are available
function EmptyState({ onCreateCampaign }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
        <MessageSquare className="h-10 w-10 text-gray-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No campaigns found</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        You don't have any campaigns that match your current filters. Create a new campaign or adjust your search criteria.
      </p>
      <Button onClick={onCreateCampaign} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Create Campaign
      </Button>
    </div>
  )
} 