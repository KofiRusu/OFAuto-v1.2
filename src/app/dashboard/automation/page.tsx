'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  MessageSquare, 
  DollarSign, 
  Send, 
  Image, 
  RefreshCw, 
  XCircle, 
  Play, 
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  MessageCircle,
  Plus,
  Settings
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ExecutionTask, 
  TaskStatus, 
  ManualTrigger 
} from '@/lib/orchestration/OrchestrationEngine'
import Link from 'next/link'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, formatDistance } from 'date-fns'
import AutomationModal from '@/components/automation/automation-modal'
import DeleteConfirmationDialog from '@/components/shared/delete-confirmation-dialog'
import ClientSelector from '@/components/clients/client-selector'
import AutomationFilters from '@/components/automation/automation-filters'
import TaskMonitor from '@/components/automation/task-monitor'
import { InsightWithAction } from '@/lib/orchestration/insightsManager'
import { useDebounce } from '@/lib/hooks/useDebounce'

// Mock client data
const mockClients = [
  { id: '1', name: 'Sarah Smith', avatar: '/avatars/sarah.jpg' },
  { id: '2', name: 'Adam Johnson', avatar: '/avatars/adam.jpg' },
  { id: '3', name: 'Emily Chen', avatar: '/avatars/emily.jpg' },
]

// Mock insights data
const mockInsights: InsightWithAction[] = [
  {
    id: '1',
    title: 'Campaign ROI Improved',
    description: 'Your automated campaign optimization has improved ROI by 23%.',
    severity: 'positive',
    timestamp: new Date().toISOString(),
    metrics: {
      roi: '+23%',
      revenue: '$3,450',
      initialSpend: '$1,500'
    }
  },
  {
    id: '2',
    title: 'Subscriber Re-engagement Success',
    description: 'Automated re-engagement messages brought back 15 lapsed subscribers.',
    severity: 'positive',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    metrics: {
      returnedSubscribers: '15',
      messagesSent: '42',
      conversionRate: '35.7%'
    }
  },
  {
    id: '3',
    title: 'New Automation Opportunity',
    description: 'We detected a pattern in subscriber behavior that could benefit from automation.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    metrics: {
      potentialIncrease: '+12%',
      targetAudience: '124 users',
      confidence: '87%'
    },
    recommendedAction: {
      type: 'createAutomation',
      description: 'Create a targeted message automation for this audience segment.'
    }
  }
]

// Mock automations data
const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Subscriber Re-engagement',
    description: 'Automatically message subscribers who haven\'t engaged in 30 days',
    clientId: '1',
    triggerType: 'subscription_dip',
    conditions: {
      threshold: 0.05,
      timeFrame: 'week'
    },
    actions: [
      {
        type: 'message',
        platform: 'onlyfans',
        params: {
          message: 'Hey there! We miss you. Here\'s a special discount just for you!',
          audience: 'inactive_subscribers'
        },
        priority: 'high'
      }
    ],
    isActive: true,
    lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'ROI Optimization',
    description: 'Adjust pricing when ROI exceeds targets',
    clientId: '1',
    triggerType: 'roi_threshold',
    conditions: {
      threshold: 2.0,
      timeFrame: 'month'
    },
    actions: [
      {
        type: 'pricing',
        platform: 'onlyfans',
        params: {
          action: 'increase',
          percentage: 10,
          message: 'Due to high demand, we\'re adjusting our subscription price. Current subscribers will keep their existing rate!'
        },
        priority: 'medium'
      }
    ],
    isActive: true,
    lastTriggeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Underperforming Campaign Adjuster',
    description: 'Boost content visibility when campaigns aren\'t meeting goals',
    clientId: '2',
    triggerType: 'campaign_underperformance',
    conditions: {
      threshold: 0.3,
      timeFrame: 'week'
    },
    actions: [
      {
        type: 'message',
        platform: 'onlyfans',
        params: {
          message: 'Check out our latest content! [link]',
          audience: 'all_subscribers'
        },
        priority: 'high'
      }
    ],
    isActive: false,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Helper function to get status badge
function getStatusBadge(automation: Automation) {
  if (!automation.isActive) {
    return <Badge variant="outline">Inactive</Badge>
  }
  
  if (automation.lastTriggeredAt) {
    const lastTriggered = new Date(automation.lastTriggeredAt)
    const now = new Date()
    const daysSinceLastTrigger = Math.floor((now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastTrigger < 7) {
      return <Badge variant="success">Active</Badge>
    }
    
    if (daysSinceLastTrigger < 30) {
      return <Badge variant="warning">Active (Idle)</Badge>
    }
  }
  
  return <Badge variant="outline">Pending</Badge>
}

// Helper function to get platform badge
function getPlatformBadge(platform: string) {
  switch (platform.toLowerCase()) {
    case 'onlyfans':
      return <Badge className="bg-[#00AEEF] hover:bg-[#00AEEF]/80">OnlyFans</Badge>
    case 'fansly':
      return <Badge className="bg-[#FF5E00] hover:bg-[#FF5E00]/80">Fansly</Badge>
    case 'instagram':
      return <Badge className="bg-[#E1306C] hover:bg-[#E1306C]/80">Instagram</Badge>
    case 'twitter':
      return <Badge className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/80">Twitter</Badge>
    default:
      return <Badge>{platform}</Badge>
  }
}

export default function AutomationDashboardPage() {
  // State
  const [selectedClient, setSelectedClient] = React.useState<string | null>(null)
  const [selectedTab, setSelectedTab] = React.useState<string>('automations')
  const [searchTerm, setSearchTerm] = React.useState<string>('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedAutomation, setSelectedAutomation] = React.useState<Automation | null>(null)
  
  // Filter automations based on search and client
  const filteredAutomations = React.useMemo(() => {
    return mockAutomations.filter(automation => {
      const matchesClient = !selectedClient || automation.clientId === selectedClient
      const matchesSearch = !debouncedSearchTerm || 
        automation.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        automation.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      
      return matchesClient && matchesSearch
    })
  }, [selectedClient, debouncedSearchTerm])
  
  // Filter insights by client
  const filteredInsights = React.useMemo(() => {
    if (!selectedClient) return mockInsights
    return mockInsights
  }, [selectedClient])

  // Event handlers
  const handleCreateAutomation = () => {
    setSelectedAutomation(null)
    setIsCreateModalOpen(true)
  }
  
  const handleEditAutomation = (automation: Automation) => {
    setSelectedAutomation(automation)
    setIsEditModalOpen(true)
  }
  
  const handleDeleteAutomation = (automation: Automation) => {
    setSelectedAutomation(automation)
    setIsDeleteDialogOpen(true)
  }
  
  const handleExecuteAutomation = (automationId: string) => {
    console.log(`Executing automation: ${automationId}`)
    // In a real implementation, this would call the API to execute the automation
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Dashboard</h1>
          <p className="text-muted-foreground">
            Create, manage and monitor your automated actions
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <ClientSelector 
            clients={mockClients}
            selectedClientId={selectedClient}
            onClientChange={setSelectedClient}
          />
          <Button onClick={handleCreateAutomation}>
            <Plus className="h-4 w-4 mr-2" />
            New Automation
          </Button>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">
            <Settings className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="monitor">
            <Clock className="h-4 w-4 mr-2" />
            Task Monitor
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart2 className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="automations" className="space-y-4">
          <AutomationFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          
          {filteredAutomations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Settings className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No automations found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {selectedClient 
                    ? "This client doesn't have any automations yet."
                    : "You haven't created any automations yet."}
                </p>
                <Button onClick={handleCreateAutomation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAutomations.map((automation) => (
                <Card key={automation.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      {getStatusBadge(automation)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {automation.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {automation.actions.map((action, index) => (
                          <div key={index} className="flex items-center">
                            {getPlatformBadge(action.platform)}
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {automation.lastTriggeredAt 
                              ? `Last triggered ${formatDistance(new Date(automation.lastTriggeredAt), new Date(), { addSuffix: true })}` 
                              : 'Never triggered'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={mockClients.find(c => c.id === automation.clientId)?.avatar} />
                          <AvatarFallback>
                            {mockClients.find(c => c.id === automation.clientId)?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{mockClients.find(c => c.id === automation.clientId)?.name}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <div className="flex justify-between w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAutomation(automation)}
                      >
                        Edit
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAutomation(automation)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                        {automation.isActive && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleExecuteAutomation(automation.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Run Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="monitor">
          <TaskMonitor clientId={selectedClient} />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1 ${
                        insight.severity === 'high' ? 'bg-destructive/20 text-destructive' :
                        insight.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                        insight.severity === 'low' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {insight.severity === 'high' ? 
                          <AlertCircle className="h-4 w-4" /> : 
                          <CheckCircle className="h-4 w-4" />
                        }
                      </div>
                      <CardTitle>{insight.title}</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistance(new Date(insight.timestamp), new Date(), { addSuffix: true })}
                    </div>
                  </div>
                  <CardDescription>
                    {insight.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {insight.metrics && Object.entries(insight.metrics).map(([key, value]) => (
                      <div key={key} className="bg-muted rounded p-2">
                        <div className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                        <div className="text-lg font-bold">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                {insight.recommendedAction && (
                  <CardFooter>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Recommended Action</AlertTitle>
                      <AlertDescription>
                        {insight.recommendedAction.description}
                      </AlertDescription>
                    </Alert>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      {isCreateModalOpen && (
        <AutomationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          clients={mockClients}
          selectedClientId={selectedClient || undefined}
        />
      )}
      
      {isEditModalOpen && selectedAutomation && (
        <AutomationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          clients={mockClients}
          automation={selectedAutomation}
        />
      )}
      
      {isDeleteDialogOpen && selectedAutomation && (
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            // In a real implementation, this would call the API to delete the automation
            console.log(`Deleting automation: ${selectedAutomation.id}`)
            setIsDeleteDialogOpen(false)
          }}
          title="Delete Automation"
          description={`Are you sure you want to delete the automation "${selectedAutomation.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  )
} 