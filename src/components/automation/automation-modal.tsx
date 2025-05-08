import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Automation } from '@/lib/hooks/useAutomationStore';
import { TriggerType } from '@/lib/orchestration/triggerEngine';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Client {
  id: string;
  name: string;
  avatar?: string;
}

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  automation?: Automation;
  selectedClientId?: string;
}

export default function AutomationModal({
  isOpen,
  onClose,
  clients,
  automation,
  selectedClientId
}: AutomationModalProps) {
  const isEditing = !!automation;
  const [activeTab, setActiveTab] = React.useState('general');
  
  // Form state
  const [name, setName] = React.useState(automation?.name || '');
  const [description, setDescription] = React.useState(automation?.description || '');
  const [clientId, setClientId] = React.useState(automation?.clientId || selectedClientId || '');
  const [triggerType, setTriggerType] = React.useState<TriggerType>(
    automation?.triggerType || TriggerType.SUBSCRIPTION_DIP
  );
  const [isActive, setIsActive] = React.useState(automation?.isActive !== false);
  const [conditions, setConditions] = React.useState(automation?.conditions || {
    threshold: 0.05,
    timeFrame: 'week'
  });
  const [actions, setActions] = React.useState(automation?.actions || [{
    type: 'message',
    platform: 'onlyfans',
    params: {
      message: '',
      audience: 'all_subscribers'
    },
    priority: 'medium'
  }]);
  
  // Validation state
  const [errors, setErrors] = React.useState<{
    name?: string;
    clientId?: string;
    actions?: string;
    general?: string;
  }>({});
  
  // Handle submitting the form
  const handleSubmit = () => {
    // Validate form
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!clientId) {
      newErrors.clientId = 'Client is required';
    }
    
    if (actions.length === 0) {
      newErrors.actions = 'At least one action is required';
    }
    
    // Check if any action has empty required fields
    const hasInvalidActions = actions.some(action => {
      if (action.type === 'message' && (!action.params.message || !action.params.audience)) {
        return true;
      }
      return false;
    });
    
    if (hasInvalidActions) {
      newErrors.actions = 'Some actions have missing required fields';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Show the tab with errors
      if (newErrors.name || newErrors.clientId || newErrors.general) {
        setActiveTab('general');
      } else if (newErrors.actions) {
        setActiveTab('actions');
      }
      return;
    }
    
    // Create the automation object
    const automationData: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      clientId,
      triggerType,
      conditions,
      actions,
      isActive
    };
    
    console.log('Submit automation:', automationData);
    // In a real implementation, this would call the API to create/update the automation
    
    // Close the modal
    onClose();
  };
  
  // Handle adding a new action
  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        type: 'message',
        platform: 'onlyfans',
        params: {
          message: '',
          audience: 'all_subscribers'
        },
        priority: 'medium'
      }
    ]);
  };
  
  // Handle removing an action
  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };
  
  // Handle updating an action
  const handleUpdateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...actions];
    
    if (field === 'type') {
      // Update params based on type
      if (value === 'message') {
        updatedActions[index] = {
          ...updatedActions[index],
          type: value,
          params: {
            message: '',
            audience: 'all_subscribers'
          }
        };
      } else if (value === 'post') {
        updatedActions[index] = {
          ...updatedActions[index],
          type: value,
          params: {
            message: '',
            mediaUrl: ''
          }
        };
      } else if (value === 'pricing') {
        updatedActions[index] = {
          ...updatedActions[index],
          type: value,
          params: {
            action: 'increase',
            percentage: 10,
            message: ''
          }
        };
      }
    } else if (field.startsWith('params.')) {
      const paramField = field.split('.')[1];
      updatedActions[index] = {
        ...updatedActions[index],
        params: {
          ...updatedActions[index].params,
          [paramField]: value
        }
      };
    } else {
      updatedActions[index] = {
        ...updatedActions[index],
        [field]: value
      };
    }
    
    setActions(updatedActions);
  };
  
  // Handle updating conditions
  const handleUpdateCondition = (field: string, value: any) => {
    setConditions({
      ...conditions,
      [field]: value
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modify your existing automation settings and actions.'
              : 'Define a new automated workflow to execute when specific conditions are met.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={errors.name ? 'text-destructive' : ''}>
                  Name {errors.name && <span className="text-destructive text-sm">({errors.name})</span>}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter automation name"
                  className={errors.name ? 'border-destructive' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this automation does"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client" className={errors.clientId ? 'text-destructive' : ''}>
                  Client {errors.clientId && <span className="text-destructive text-sm">({errors.clientId})</span>}
                </Label>
                <Select 
                  value={clientId} 
                  onValueChange={setClientId}
                >
                  <SelectTrigger id="client" className={errors.clientId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select 
                  value={triggerType} 
                  onValueChange={(value) => setTriggerType(value as TriggerType)}
                >
                  <SelectTrigger id="triggerType">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TriggerType.SUBSCRIPTION_DIP}>Subscription Dip</SelectItem>
                    <SelectItem value={TriggerType.ROI_THRESHOLD}>ROI Threshold</SelectItem>
                    <SelectItem value={TriggerType.CAMPAIGN_UNDERPERFORMANCE}>Campaign Underperformance</SelectItem>
                    <SelectItem value={TriggerType.CONTENT_PERFORMANCE}>Content Performance</SelectItem>
                    <SelectItem value={TriggerType.EXPERIMENT_CONCLUSION}>Experiment Conclusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Trigger Conditions</h3>
                    
                    {triggerType === TriggerType.SUBSCRIPTION_DIP && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="threshold">Threshold (% decrease)</Label>
                          <div className="relative">
                            <Input
                              id="threshold"
                              type="number"
                              value={(conditions.threshold * 100).toString()}
                              onChange={(e) => handleUpdateCondition('threshold', parseFloat(e.target.value) / 100)}
                              min="0"
                              max="100"
                              step="1"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeFrame">Time Frame</Label>
                          <Select 
                            value={conditions.timeFrame} 
                            onValueChange={(value) => handleUpdateCondition('timeFrame', value)}
                          >
                            <SelectTrigger id="timeFrame">
                              <SelectValue placeholder="Select time frame" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Daily</SelectItem>
                              <SelectItem value="week">Weekly</SelectItem>
                              <SelectItem value="month">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {triggerType === TriggerType.ROI_THRESHOLD && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="threshold">ROI Threshold</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="threshold"
                              type="number"
                              value={conditions.threshold?.toString() || '2.0'}
                              onChange={(e) => handleUpdateCondition('threshold', parseFloat(e.target.value))}
                              min="0"
                              step="0.1"
                            />
                            <span>× (Return vs Investment)</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeFrame">Time Frame</Label>
                          <Select 
                            value={conditions.timeFrame || 'week'} 
                            onValueChange={(value) => handleUpdateCondition('timeFrame', value)}
                          >
                            <SelectTrigger id="timeFrame">
                              <SelectValue placeholder="Select time frame" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Daily</SelectItem>
                              <SelectItem value="week">Weekly</SelectItem>
                              <SelectItem value="month">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {triggerType === TriggerType.CAMPAIGN_UNDERPERFORMANCE && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="threshold">Underperformance Threshold (% below expected)</Label>
                          <div className="relative">
                            <Input
                              id="threshold"
                              type="number"
                              value={(conditions.threshold * 100).toString()}
                              onChange={(e) => handleUpdateCondition('threshold', parseFloat(e.target.value) / 100)}
                              min="0"
                              max="100"
                              step="1"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeFrame">Time Frame</Label>
                          <Select 
                            value={conditions.timeFrame} 
                            onValueChange={(value) => handleUpdateCondition('timeFrame', value)}
                          >
                            <SelectTrigger id="timeFrame">
                              <SelectValue placeholder="Select time frame" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Daily</SelectItem>
                              <SelectItem value="week">Weekly</SelectItem>
                              <SelectItem value="month">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-6 mt-4">
            {errors.actions && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.actions}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Actions</h3>
                <Button onClick={handleAddAction} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Define what actions should be taken when the trigger conditions are met.
              </p>
            </div>
            
            {actions.length === 0 ? (
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">No actions defined yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base font-medium flex items-center gap-2">
                          Action {index + 1}
                          <Badge variant="outline">{action.platform}</Badge>
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveAction(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`action-${index}-type`}>Action Type</Label>
                            <Select 
                              value={action.type} 
                              onValueChange={(value) => handleUpdateAction(index, 'type', value)}
                            >
                              <SelectTrigger id={`action-${index}-type`}>
                                <SelectValue placeholder="Select action type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="message">Send Message</SelectItem>
                                <SelectItem value="post">Create Post</SelectItem>
                                <SelectItem value="pricing">Update Pricing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`action-${index}-platform`}>Platform</Label>
                            <Select 
                              value={action.platform} 
                              onValueChange={(value) => handleUpdateAction(index, 'platform', value)}
                            >
                              <SelectTrigger id={`action-${index}-platform`}>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onlyfans">OnlyFans</SelectItem>
                                <SelectItem value="fansly">Fansly</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="twitter">Twitter</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {action.type === 'message' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-message`}>Message</Label>
                              <Textarea
                                id={`action-${index}-message`}
                                value={action.params.message || ''}
                                onChange={(e) => handleUpdateAction(index, 'params.message', e.target.value)}
                                placeholder="Enter message content"
                                rows={3}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-audience`}>Audience</Label>
                              <Select 
                                value={action.params.audience || 'all_subscribers'} 
                                onValueChange={(value) => handleUpdateAction(index, 'params.audience', value)}
                              >
                                <SelectTrigger id={`action-${index}-audience`}>
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all_subscribers">All Subscribers</SelectItem>
                                  <SelectItem value="inactive_subscribers">Inactive Subscribers</SelectItem>
                                  <SelectItem value="new_subscribers">New Subscribers</SelectItem>
                                  <SelectItem value="high_spenders">High Spenders</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        {action.type === 'post' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-message`}>Post Content</Label>
                              <Textarea
                                id={`action-${index}-message`}
                                value={action.params.message || ''}
                                onChange={(e) => handleUpdateAction(index, 'params.message', e.target.value)}
                                placeholder="Enter post content"
                                rows={3}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-mediaUrl`}>Media URL (Optional)</Label>
                              <Input
                                id={`action-${index}-mediaUrl`}
                                value={action.params.mediaUrl || ''}
                                onChange={(e) => handleUpdateAction(index, 'params.mediaUrl', e.target.value)}
                                placeholder="Enter media URL"
                              />
                            </div>
                          </>
                        )}
                        
                        {action.type === 'pricing' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-pricingAction`}>Pricing Action</Label>
                              <Select 
                                value={action.params.action || 'increase'} 
                                onValueChange={(value) => handleUpdateAction(index, 'params.action', value)}
                              >
                                <SelectTrigger id={`action-${index}-pricingAction`}>
                                  <SelectValue placeholder="Select pricing action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="increase">Increase Price</SelectItem>
                                  <SelectItem value="decrease">Decrease Price</SelectItem>
                                  <SelectItem value="discount">Apply Discount</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-percentage`}>Percentage</Label>
                              <div className="relative">
                                <Input
                                  id={`action-${index}-percentage`}
                                  type="number"
                                  value={action.params.percentage || 10}
                                  onChange={(e) => handleUpdateAction(index, 'params.percentage', parseInt(e.target.value))}
                                  min="1"
                                  max="100"
                                  step="1"
                                  className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`action-${index}-message`}>Announcement Message (Optional)</Label>
                              <Textarea
                                id={`action-${index}-message`}
                                value={action.params.message || ''}
                                onChange={(e) => handleUpdateAction(index, 'params.message', e.target.value)}
                                placeholder="Enter announcement message"
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor={`action-${index}-priority`}>Priority</Label>
                          <Select 
                            value={action.priority || 'medium'} 
                            onValueChange={(value) => handleUpdateAction(index, 'priority', value)}
                          >
                            <SelectTrigger id={`action-${index}-priority`}>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Update' : 'Create'} Automation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 