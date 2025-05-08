import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function PatreonIntegrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Patreon Integration</h1>
        <Link href="/dashboard/integrations">
          <Button variant="outline">Back to Integrations</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Patreon</CardTitle>
          <CardDescription>
            Link your Patreon creator account to enable automatic content synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
            <p>🚧 This module is under construction</p>
            <p className="text-sm mt-2">Patreon integration will be available in the next update.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input id="clientId" placeholder="Patreon OAuth Client ID" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input id="clientSecret" placeholder="Patreon OAuth Client Secret" disabled />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled>Connect with Patreon</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 