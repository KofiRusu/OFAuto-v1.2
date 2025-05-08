'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Search, 
  Database, 
  Server, 
  Shield,
  FileText,
  Clock,
  RefreshCw
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

// List of runbook metadata
const runbooks = [
  {
    id: 'rds-failover',
    title: 'RDS Multi-AZ Failover',
    category: 'database',
    description: 'Procedure for handling Amazon RDS failover in Multi-AZ deployments',
    path: '/docs/runbooks/rds-failover.md',
    icon: <Database className="h-4 w-4" />,
    lastUpdated: '2023-05-10'
  },
  {
    id: 'ecs-rollback',
    title: 'ECS Service Rollback',
    category: 'infrastructure',
    description: 'How to roll back an ECS service to a previous task definition',
    path: '/docs/runbooks/ecs-rollback.md',
    icon: <Server className="h-4 w-4" />,
    lastUpdated: '2023-05-12'
  },
  {
    id: 'tls-renewal',
    title: 'TLS Certificate Renewal',
    category: 'security',
    description: 'Process for renewing TLS/SSL certificates',
    path: '/docs/runbooks/tls-renewal.md',
    icon: <Shield className="h-4 w-4" />,
    lastUpdated: '2023-05-15'
  },
  {
    id: 'incident-triage',
    title: 'Incident Triage Flow',
    category: 'operations',
    description: 'Standard operating procedure for triaging production incidents',
    path: '/docs/runbooks/incident-triage.md',
    icon: <FileText className="h-4 w-4" />,
    lastUpdated: '2023-05-18'
  }
];

export default function RunbooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRunbook, setSelectedRunbook] = useState<string | null>(null);
  const [runbookContent, setRunbookContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter runbooks based on search query and category
  const filteredRunbooks = runbooks.filter(runbook => {
    const matchesSearch = 
      runbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      runbook.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || runbook.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Load runbook content when selected
  useEffect(() => {
    if (!selectedRunbook) {
      setRunbookContent('');
      return;
    }
    
    const loadRunbookContent = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would fetch from a real endpoint
        const selectedRunbookData = runbooks.find(r => r.id === selectedRunbook);
        
        // Simulate loading the runbook content
        // In production, this would be a fetch to get the actual markdown file
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (selectedRunbook === 'rds-failover') {
          setRunbookContent(`# RDS Multi-AZ Failover Runbook

## Overview

This runbook provides step-by-step guidance for handling a manual failover for Amazon RDS in a Multi-AZ configuration. Use this procedure when you need to switch from the primary to the standby RDS instance.

## Prerequisites

- AWS Console access with appropriate IAM permissions
- AWS CLI configured with necessary permissions
- Database connection credentials

## Symptoms

Indicators that may require a failover:
- High database latency or timeouts
- Degraded performance in the primary AZ
- Planned maintenance requiring AZ switchover
- AWS notification of problems in the primary AZ

## Procedure

### 1. Verify the Issue

Before initiating a failover, confirm there's an actual problem...

[See full runbook for complete details]`);
        } else if (selectedRunbook === 'ecs-rollback') {
          setRunbookContent(`# ECS Service Rollback Runbook

## Overview

This runbook provides step-by-step instructions for rolling back an ECS service to a previous task definition version in the event of a deployment failure or service degradation.

## Prerequisites

- AWS Console access with appropriate IAM permissions
- AWS CLI configured with necessary permissions
- Knowledge of the service and task definition to roll back

## Symptoms

Indicators that may require a rollback:
- Increased error rates after a deployment
- Service health check failures
- Performance degradation
- Functionality issues reported by users
- Abnormal CloudWatch metrics

[See full runbook for complete details]`);
        } else {
          setRunbookContent(`# ${selectedRunbookData?.title || 'Runbook'}

This runbook content is not available yet. Please check back later.

## Contact Information

- DevOps team: #devops-support Slack channel
- On-call phone: +1-555-123-4567`);
        }
      } catch (error) {
        console.error('Error loading runbook:', error);
        setRunbookContent('Error loading runbook content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRunbookContent();
  }, [selectedRunbook]);
  
  // Reset selected runbook when category changes
  useEffect(() => {
    setSelectedRunbook(null);
  }, [selectedCategory]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Operational Runbooks</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Last updated: 2023-05-18
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search runbooks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="database">DB</TabsTrigger>
              <TabsTrigger value="infrastructure">Infra</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-y-2">
            {filteredRunbooks.map(runbook => (
              <Button
                key={runbook.id}
                variant={selectedRunbook === runbook.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedRunbook(runbook.id)}
              >
                <div className="flex items-center">
                  {runbook.icon}
                  <span className="ml-2">{runbook.title}</span>
                </div>
              </Button>
            ))}
            
            {filteredRunbooks.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No runbooks found matching your search.
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="col-span-1 md:col-span-3">
          {selectedRunbook ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {runbooks.find(r => r.id === selectedRunbook)?.title || 'Runbook'}
                </CardTitle>
                <CardDescription>
                  {runbooks.find(r => r.id === selectedRunbook)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-4">
                    <ReactMarkdown>{runbookContent}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Last updated: {runbooks.find(r => r.id === selectedRunbook)?.lastUpdated}
                </div>
                <Button variant="outline">
                  Export as PDF
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/10">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Runbook</h3>
              <p className="text-muted-foreground">
                Choose a runbook from the sidebar to view its content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 