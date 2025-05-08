import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function OnlyFansIntegrationPage() {
  // Placeholder for loading state - will be replaced with real data fetching
  const isLoading = false;
  const error = null;
  const isConnected = false;

  if (isLoading) return <IntegrationSkeleton />;
  if (error) return <ErrorDisplay message="Failed to load OnlyFans integration status" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">OnlyFans Integration</h1>
        <Link href="/dashboard/integrations">
          <Button variant="outline">Back to Integrations</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect OnlyFans Account</CardTitle>
          <CardDescription>
            Enter your OnlyFans session data to enable automation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Your OnlyFans username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Your OnlyFans password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionData">Session Cookies (Optional)</Label>
            <Input id="sessionData" placeholder="Paste session cookie JSON" />
            <p className="text-xs text-muted-foreground">
              For enhanced security, you can paste your session cookies JSON instead of username/password.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Connect Account</Button>
        </CardFooter>
      </Card>

      <Separator />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        {isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>@username</CardTitle>
              <CardDescription>Connected 3 days ago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last refresh:</span>
                  <span className="text-sm">Today, 2:30 PM</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Refresh</Button>
              <Button variant="destructive">Disconnect</Button>
            </CardFooter>
          </Card>
        ) : (
          <p className="text-muted-foreground">No accounts connected yet.</p>
        )}
      </div>
    </div>
  );
}

function IntegrationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
      <h3 className="font-medium">Error</h3>
      <p>{message}</p>
    </div>
  );
} 