import { SuccessStoriesGrid } from "@/components/SuccessStoriesGrid";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Success Stories & Case Studies | OFAuto",
  description: "View real-world success stories and case studies from AI strategies"
};

export default async function SuccessStoriesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const client = await prisma.client.findFirst({
    where: {
      userId
    }
  });

  if (!client) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Success Stories & Case Studies</h1>
        <p className="text-muted-foreground mt-1">
          Learn from real-world implementations of AI strategies
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="mine">My Client</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <SuccessStoriesGrid initialType="PRICING" />
        </TabsContent>
        
        <TabsContent value="mine" className="mt-6">
          <SuccessStoriesGrid clientId={client.id} initialType="PRICING" />
        </TabsContent>
        
        <TabsContent value="featured" className="mt-6">
          <SuccessStoriesGrid initialType="PRICING" filter="featured" />
        </TabsContent>
      </Tabs>

      <div className="mt-12 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Why Case Studies Matter</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Proven Results</h3>
            <p className="text-sm text-muted-foreground">
              See verified metrics from real implementations, not just theoretical projections.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Implementation Insights</h3>
            <p className="text-sm text-muted-foreground">
              Learn how others overcame challenges and the exact steps they took.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">ROI Confidence</h3>
            <p className="text-sm text-muted-foreground">
              Gain confidence in your investment with clear timeframes and return metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 