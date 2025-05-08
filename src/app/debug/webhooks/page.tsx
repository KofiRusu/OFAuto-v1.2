'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@prisma/client';
import { useRoleCheck } from '@/hooks/use-role-check';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  UserPlus,
  UserMinus,
  UserCog,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function WebhookTestPage() {
  const { user } = useUser();
  const router = useRouter();
  const { isAdmin, isLoading } = useRoleCheck();
  const [webhookType, setWebhookType] = useState('user.created');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  
  // Environment check
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // If in production or not an admin, show access denied
  if (isProduction || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Access Denied
            </CardTitle>
            <CardDescription className="text-red-600">
              This debugging page is not available in production or to non-admin users.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p>This page is only accessible to administrators in development environments for security reasons.</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/webhook-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: webhookType,
          data: {
            id: userId || undefined,
            email: email || undefined,
            name: name || undefined,
          },
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Webhook test successful',
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to send webhook test request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getWebhookIcon = () => {
    switch (webhookType) {
      case 'user.created':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'user.updated':
        return <UserCog className="h-5 w-5 text-blue-500" />;
      case 'user.deleted':
        return <UserMinus className="h-5 w-5 text-red-500" />;
      default:
        return <ShieldAlert className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" /> 
                Webhook Testing Tool
              </CardTitle>
              <CardDescription>
                Simulate Clerk webhook events for development purposes
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              DEV ONLY
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-amber-50 p-4 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Development Testing Tool</p>
              <p className="text-sm text-amber-700 mt-1">
                This tool simulates Clerk webhook events to test database synchronization. 
                Use it to validate webhook handling logic without triggering real Clerk events.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookType">Webhook Event Type</Label>
              <Select
                value={webhookType}
                onValueChange={setWebhookType}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getWebhookIcon()}
                    <SelectValue placeholder="Select an event type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user.created">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-green-500" />
                      <span>user.created</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user.updated">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-500" />
                      <span>user.updated</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user.deleted">
                    <div className="flex items-center gap-2">
                      <UserMinus className="h-4 w-4 text-red-500" />
                      <span>user.deleted</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(webhookType === 'user.updated' || webhookType === 'user.deleted') && (
              <div className="space-y-2">
                <Label htmlFor="userId">User ID (Clerk ID)</Label>
                <Input 
                  id="userId" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)} 
                  placeholder="Enter existing Clerk user ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required for user.updated and user.deleted events
                </p>
              </div>
            )}
            
            {(webhookType === 'user.created' || webhookType === 'user.updated') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="user@example.com"
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="User's full name"
                  />
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>Simulate Webhook</>
              )}
            </Button>
          </form>
          
          {result && (
            <div className={`p-4 rounded-md mt-4 ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {result.success ? 'Success' : 'Error'}
                  </p>
                  <p className="text-sm mt-1">
                    {result.message || result.error || 'Unknown result'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Current user: {user?.primaryEmailAddress?.emailAddress || 'Unknown'} (Admin)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 