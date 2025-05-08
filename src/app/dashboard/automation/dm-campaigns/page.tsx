"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  ChevronDown, 
  Filter, 
  MailPlus, 
  Pause, 
  Play, 
  Search, 
  Trash, 
  UserPlus,
  Wand2,
  PersonStanding,
  BarChart,
  FileText,
  MessageCircle,
  Plus
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AutoDMEngine, 
  DMCampaign, 
  DMCampaignStatus, 
  DMTemplate, 
  DMTriggerType 
} from "@/services/autoDMEngine";
import { clientLogger } from "@/lib/logger";
import { trpc } from "@/lib/trpc/client";
import { DMTemplateEditor } from "@/components/templates/DMTemplateEditor";
import { applyTemplate, parseTemplateVariables } from "@/lib/utils/template";
import { CampaignPerformanceCard } from "@/components/dashboard/campaigns/CampaignPerformanceCard";
import { MockMessageControls } from "@/components/dashboard/campaigns/MockMessageControls";
import { simulateDMEvents } from "@/lib/tracking/dmEvents";
import { EmptyState } from "@/components/ui/empty-state";

// Example features data
const features = [
  {
    title: 'Smart Personalization',
    description: 'Create templates with dynamic variables and fallback chains to ensure your messages always look natural.',
    icon: <Wand2 className="h-5 w-5" />
  },
  {
    title: 'Target Audience Segmentation',
    description: 'Send messages to specific audience segments based on engagement, subscription status, and more.',
    icon: <PersonStanding className="h-5 w-5" />
  },
  {
    title: 'Performance Analytics',
    description: 'Track key metrics like open rates, response rates, and conversions to optimize your campaigns.',
    icon: <BarChart className="h-5 w-5" />
  },
  {
    title: 'Template Library',
    description: 'Access pre-written templates optimized for different platforms and use cases.',
    icon: <FileText className="h-5 w-5" />
  }
];

export default function DMCampaignsPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Log analytics event when page is viewed
  useEffect(() => {
    // Log to client logger (development only)
    clientLogger.info("DM Campaigns page viewed", { path: pathname });
    
    // In a real implementation with proper analytics, you might use:
    // analyticsClient.trackEvent('dm_campaigns_page_viewed', { from: pathname });
    
    // Alternatively, if you have access to the client ID, you could use trpc:
    // const { data: activeClient } = trpc.client.getActiveClient.useQuery();
    // if (activeClient) {
    //   trpc.analytics.trackEngagement.mutate({
    //     clientId: activeClient.id,
    //     platformId: 'webapp',
    //     eventType: 'view',
    //     count: 1
    //   });
    // }
  }, [pathname]);
  
  // State for campaigns and templates
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [templates, setTemplates] = useState<DMTemplate[]>([]);
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>([]);
  
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  // State for modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  
  // State for new campaign/template
  const [newTemplate, setNewTemplate] = useState<Omit<DMTemplate, "id">>({
    name: "",
    content: "",
    platformId: "",
    variables: []
  });
  
  const [newCampaign, setNewCampaign] = useState<Omit<DMCampaign, "id">>({
    name: "",
    platformIds: [],
    templateId: "",
    triggerType: DMTriggerType.ENGAGEMENT,
    status: DMCampaignStatus.DRAFT,
    throttleRate: 5,
    personalization: {}
  });
  
  // Mock DM engine (would be injected via context or similar in real app)
  const dmEngine = new AutoDMEngine();
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const campaigns = dmEngine.getCampaigns();
      const templates = dmEngine.getTemplates();
      const platforms = dmEngine.getSupportedDMPlatforms();
      
      setCampaigns(campaigns);
      setTemplates(templates);
      setSupportedPlatforms(platforms);
    };
    
    loadData();
  }, []);
  
  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && campaign.status !== statusFilter) {
      return false;
    }
    
    // Platform filter
    if (platformFilter !== "all" && !campaign.platformIds.includes(platformFilter)) {
      return false;
    }
    
    return true;
  });
  
  // Handle campaign status change
  const handleStatusChange = (campaignId: string, newStatus: DMCampaignStatus) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus } 
          : campaign
      )
    );
  };
  
  // Handle template creation
  const handleCreateTemplate = () => {
    const template = dmEngine.createTemplate(newTemplate);
    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: "",
      content: "",
      platformId: "",
      variables: []
    });
    setIsTemplateModalOpen(false);
  };
  
  // Handle campaign creation
  const handleCreateCampaign = () => {
    try {
      const campaign = dmEngine.createCampaign(newCampaign);
      setCampaigns(prev => [...prev, campaign]);
      setNewCampaign({
        name: "",
        platformIds: [],
        templateId: "",
        triggerType: DMTriggerType.ENGAGEMENT,
        status: DMCampaignStatus.DRAFT,
        throttleRate: 5,
        personalization: {}
      });
      setIsCampaignModalOpen(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
      // Would show error toast in real app
    }
  };
  
  // Campaign card component
  const CampaignCard = ({ campaign }: { campaign: DMCampaign }) => {
    const template = templates.find(t => t.id === campaign.templateId);
    
    // Mock message ID for simulation
    const mockMessageId = `dm-simulation-${campaign.id}`;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>
                {campaign.triggerType.replace("_", " ")} • Template: {template?.name || "Unknown"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {campaign.status === DMCampaignStatus.ACTIVE ? (
                    <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, DMCampaignStatus.PAUSED)}>
                      <Pause className="mr-2 h-4 w-4" />
                      <span>Pause campaign</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, DMCampaignStatus.ACTIVE)}>
                      <Play className="mr-2 h-4 w-4" />
                      <span>Activate campaign</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Add targets</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Badge className="mt-1" variant={getStatusVariant(campaign.status)}>
            {campaign.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Platforms: </span>
                {campaign.platformIds.join(", ")}
              </div>
              <div>
                <span className="font-medium">Throttle: </span>
                {campaign.throttleRate}/hr
              </div>
            </div>
            
            {template && (
              <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Template preview:</p>
                <p className="text-muted-foreground line-clamp-2">
                  {template.content}
                </p>
              </div>
            )}
            
            <div className="pt-2">
              <MockMessageControls
                campaignId={campaign.id}
                onSendClick={() => simulateDMEvents(mockMessageId, campaign)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const getStatusVariant = (status: DMCampaignStatus) => {
    switch (status) {
      case DMCampaignStatus.ACTIVE:
        return "default";
      case DMCampaignStatus.PAUSED:
        return "secondary";
      case DMCampaignStatus.DRAFT:
        return "outline";
      default:
        return "outline";
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DM Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage personalized direct message campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MailPlus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              {/* Template creation form */}
            </DialogContent>
          </Dialog>
          
          <Button asChild>
            <Link href="/dashboard/automation/dm-campaigns/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>
      
      {/* New Feature Showcase */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                New Feature
              </Badge>
              <h2 className="text-2xl font-bold">Personalized DM Campaigns</h2>
              <p>
                Connect with your audience through automated yet personalized direct messages. 
                Our new fallback chain technology ensures your messages always look natural and 
                personalized, even when some user data is missing.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/dashboard/automation/dm-campaigns/create">
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/automation/dm-campaigns/docs/personalization">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            <div className="bg-card rounded-lg p-5 border">
              <div className="space-y-2">
                <div className="font-semibold">Personalization Example:</div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">
                    Hey <span className="text-primary">{'{{firstName|username|"friend"}}'}</span>, thanks for the follow!
                  </code>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">Outputs:</div>
                  <div className="pl-4">
                    <span className="text-green-600">→</span> Hey John, thanks for the follow!
                  </div>
                  <div className="pl-4">
                    <span className="text-green-600">→</span> Hey user123, thanks for the follow!
                  </div>
                  <div className="pl-4">
                    <span className="text-green-600">→</span> Hey friend, thanks for the follow!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value={DMCampaignStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={DMCampaignStatus.PAUSED}>Paused</SelectItem>
              <SelectItem value={DMCampaignStatus.DRAFT}>Draft</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {supportedPlatforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns" 
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCampaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="No campaigns yet"
          description="Create your first DM campaign to engage with your audience."
          action={
            <Button asChild>
              <Link href="/dashboard/automation/dm-campaigns/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          }
        />
      )}
      
      <h2 className="text-xl font-semibold pt-4">DM Campaign Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Create Campaign Dialog */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create DM Campaign</DialogTitle>
            <DialogDescription>
              Set up a new direct message campaign to engage with your audience.
            </DialogDescription>
          </DialogHeader>
          
          {/* Campaign creation form would go here */}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 