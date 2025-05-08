import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function KofiIntegrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ko-fi Integration</h1>
        <Link href="/dashboard/integrations">
          <Button variant="outline">Back to Integrations</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Ko-fi</CardTitle>
          <CardDescription>
            Link your Ko-fi account to track donations and supporter information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Ko-fi API Key</Label>
            <Input id="apiKey" placeholder="Your Ko-fi API Key" />
            <p className="text-xs text-muted-foreground">
              You can find your API key in your Ko-fi account settings.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input id="webhookUrl" value="https://yourdomain.com/api/integrations/kofi/webhook" readOnly />
            <p className="text-xs text-muted-foreground">
              Add this webhook URL to your Ko-fi settings to enable real-time notifications.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Connect Ko-fi</Button>
        </CardFooter>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
              <p>⚠️ Not Connected</p>
              <p className="text-sm mt-2">Add your Ko-fi API key to connect your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 