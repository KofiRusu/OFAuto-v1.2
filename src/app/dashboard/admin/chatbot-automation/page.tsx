'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/components/ui/use-toast';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChatbotAutomationForm } from '@/components/forms/ChatbotAutomationForm';

export default function ChatbotAutomationPage() {
  const router = useRouter();
  const { user } = useUser();
  
  // Get user role from Clerk metadata for feature flag
  const userRole = user?.publicMetadata?.role as UserRole | undefined;
  
  // Check if user is allowed to access this page
  const canAccessPage = useFeatureFlag(userRole, 'MANAGER_ANALYTICS'); // Or another appropriate flag
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  
  // Query automations
  const {
    data: automationsData,
    isLoading: isLoadingAutomations,
    isError: isAutomationsError,
    refetch: refetchAutomations,
  } = trpc.chatbotAutomation.getAutomations.useQuery(undefined, {
    enabled: !!canAccessPage, // Only run if user has access
  });
  
  // Mutation for toggling active state
  const toggleActiveMutation = trpc.chatbotAutomation.updateAutomation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Automation status updated successfully',
      });
      refetchAutomations();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update automation status',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting automation
  const deleteAutomationMutation = trpc.chatbotAutomation.deleteAutomation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Automation deleted successfully',
      });
      refetchAutomations();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete automation',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for manual trigger
  const triggerAutomationMutation = trpc.chatbotAutomation.triggerAutomation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Automation triggered successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger automation',
        variant: 'destructive',
      });
    },
  });
  
  // Handle toggle active state
  const handleToggleActive = (id: string, currentState: boolean) => {
    toggleActiveMutation.mutate({
      id,
      isActive: !currentState,
    });
  };
  
  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      deleteAutomationMutation.mutate({ id });
    }
  };
  
  // Handle manual trigger
  const handleTrigger = (id: string) => {
    triggerAutomationMutation.mutate({ id });
  };
  
  // Handle clicking edit
  const handleEdit = (id: string) => {
    setSelectedAutomation(id);
  };
  
  // If user doesn't have access, show permission error
  if (!canAccessPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Permission Denied</CardTitle>
            <CardDescription>
              You do not have permission to access chatbot automation management.
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
  
  // Show loading state
  if (isLoadingAutomations) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Show error state
  if (isAutomationsError) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load chatbot automations. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => refetchAutomations()} className="w-full">
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Get automations
  const automations = automationsData?.automations || [];
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Automations</h1>
          <p className="text-muted-foreground">
            Create and manage AI-powered chatbot automations for your business.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription>
                Set up a new chatbot automation with customized triggers and actions.
              </DialogDescription>
            </DialogHeader>
            <ChatbotAutomationForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                refetchAutomations();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Automations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Automations</CardTitle>
          <CardDescription>
            All your configured chatbot automations. Toggle to enable/disable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No automations created yet. Click "Create Automation" to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.map((automation) => (
                  <TableRow key={automation.id}>
                    <TableCell className="font-medium">{automation.name}</TableCell>
                    <TableCell>
                      {automation.persona ? automation.persona.name : 'Unknown'}
                    </TableCell>
                    <TableCell>{automation.triggerType}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() => handleToggleActive(automation.id, automation.isActive)}
                        />
                        <Badge variant={automation.isActive ? 'default' : 'outline'}>
                          {automation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(automation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(automation.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTrigger(automation.id)}
                          disabled={!automation.isActive}
                        >
                          Run
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(automation.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      {selectedAutomation && (
        <Dialog 
          open={!!selectedAutomation} 
          onOpenChange={(open) => !open && setSelectedAutomation(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Automation</DialogTitle>
              <DialogDescription>
                Update the settings for this chatbot automation.
              </DialogDescription>
            </DialogHeader>
            <ChatbotAutomationForm
              automationId={selectedAutomation}
              onSuccess={() => {
                setSelectedAutomation(null);
                refetchAutomations();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 