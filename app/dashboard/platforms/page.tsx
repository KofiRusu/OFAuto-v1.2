"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";
import { Icons } from "@/components/ui/icons";
import { UserRole } from "@prisma/client";
import { Globe, MessageCircle, Share2, ArrowUpRight } from "lucide-react";

export default function PlatformsPage() {
  const router = useRouter();
  const { userId, sessionClaims } = useAuth();
  
  // Get the user role from sessionClaims
  const userRole = sessionClaims?.userRole || "USER";
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("all");

  // Query to get approved platforms for the current user
  const {
    data: platformsData,
    isLoading: isLoadingPlatforms,
    refetch: refetchPlatforms,
  } = trpc.platformAccess.getUserPlatforms.useQuery(
    {
      // Don't need to pass userId as the endpoint will use the authenticated user
      includeUnapproved: false, // Only show approved platforms for models
    },
    {
      enabled: !!userId,
      refetchOnWindowFocus: true,
    }
  );

  // Helper function to get platform badge color
  const getPlatformBadgeStyles = (platformType: string) => {
    const typeMap: Record<string, { bg: string, hover: string }> = {
      onlyfans: { bg: "bg-[#00AEEF]", hover: "hover:bg-[#00AEEF]/80" },
      fansly: { bg: "bg-[#FF5E00]", hover: "hover:bg-[#FF5E00]/80" },
      patreon: { bg: "bg-[#F96854]", hover: "hover:bg-[#F96854]/80" },
      kofi: { bg: "bg-[#13C3FF]", hover: "hover:bg-[#13C3FF]/80" },
      gumroad: { bg: "bg-[#FF90E8]", hover: "hover:bg-[#FF90E8]/80" },
      instagram: { bg: "bg-[#E1306C]", hover: "hover:bg-[#E1306C]/80" },
      twitter: { bg: "bg-[#1DA1F2]", hover: "hover:bg-[#1DA1F2]/80" },
    };

    return typeMap[platformType.toLowerCase()] || { bg: "bg-gray-500", hover: "hover:bg-gray-500/80" };
  };

  // Filter platforms by category based on active tab
  const filterPlatformsByCategory = (platforms: any[]) => {
    if (activeTab === "all") return platforms;
    
    const categoryMap: Record<string, string[]> = {
      monetization: ["onlyfans", "fansly", "patreon", "kofi", "gumroad"],
      social: ["instagram", "twitter"],
    };
    
    return platforms.filter(platform => 
      platform.platform && categoryMap[activeTab]?.includes(platform.platform.type.toLowerCase())
    );
  };

  const filteredPlatforms = platformsData?.platformAccess ? 
    filterPlatformsByCategory(platformsData.platformAccess) : [];

  // Group platforms by status
  const platformsByStatus = filteredPlatforms.reduce((acc: Record<string, any[]>, platform) => {
    const status = platform.platform?.status || "UNKNOWN";
    if (!acc[status]) acc[status] = [];
    acc[status].push(platform);
    return acc;
  }, {});

  // Status display helper
  const getStatusDisplay = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return { label: "Active", color: "text-green-500" };
      case "PENDING":
        return { label: "Pending", color: "text-yellow-500" };
      case "ERROR":
        return { label: "Error", color: "text-red-500" };
      case "DISCONNECTED":
        return { label: "Disconnected", color: "text-gray-500" };
      default:
        return { label: "Unknown", color: "text-gray-500" };
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Platforms</h1>
          <p className="text-gray-500">
            View and manage your approved platform connections
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Platforms</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoadingPlatforms ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !platformsData?.platformAccess || platformsData.platformAccess.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No approved platforms available</h3>
            <p className="mt-1 text-gray-500">
              {userRole === UserRole.MODEL ? 
                "Your manager hasn't approved any platforms for you yet." : 
                "You don't have any platforms connected."}
            </p>
            {userRole !== UserRole.MODEL && (
              <Button 
                onClick={() => router.push('/dashboard/credentials')}
                className="mt-4"
              >
                Connect Platforms
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredPlatforms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No platforms in this category</h3>
            <p className="mt-1 text-gray-500">
              Try selecting a different category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlatforms.map((platform) => (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${getPlatformBadgeStyles(platform.platform?.type || "").bg} ${getPlatformBadgeStyles(platform.platform?.type || "").hover}`}
                    >
                      {platform.platform?.name || "Unknown Platform"}
                    </Badge>
                    <Badge variant="outline" className={getStatusDisplay(platform.platform?.status || "").color}>
                      {getStatusDisplay(platform.platform?.status || "").label}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {platform.platform?.username ? 
                    `Connected as: ${platform.platform.username}` : 
                    "No username information available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p>This platform has been approved for your use. You can now schedule posts, manage campaigns, and view analytics for this platform.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/scheduler')}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Schedule Posts
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/automation/dm-campaigns')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  DM Campaigns
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 