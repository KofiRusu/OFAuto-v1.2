"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Play, Pause, User, CalendarClock, MessageSquare } from "lucide-react";
import { AutoDMCampaignStatus } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Platform {
  id: string;
  name: string;
  type: string;
}

interface AutoDMCampaign {
  id: string;
  name: string;
  status: AutoDMCampaignStatus;
  targetAudience: string;
  messageTemplate: string;
  imageUrl?: string | null;
  startDate: Date;
  endDate?: Date | null;
  frequency: number;
  totalMessages: number;
  sentMessages: number;
  platform: Platform;
  createdAt: Date;
  updatedAt: Date;
}

interface AutoDMCampaignCardProps {
  campaign: AutoDMCampaign;
  onEdit: () => void;
  onDelete: () => void;
}

export function AutoDMCampaignCard({ campaign, onEdit, onDelete }: AutoDMCampaignCardProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Delete mutation
  const deleteMutation = trpc.autoDM.delete.useMutation({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      onDelete();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete campaign",
        description: error.message,
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = trpc.autoDM.updateStatus.useMutation({
    onSuccess: (data) => {
      setIsToggling(false);
      toast({
        title: `Campaign ${data.status === "ACTIVE" ? "activated" : "paused"}`,
        description: `The campaign has been ${data.status === "ACTIVE" ? "activated" : "paused"} successfully.`,
      });
    },
    onError: (error) => {
      setIsToggling(false);
      toast({
        variant: "destructive",
        title: "Failed to update campaign status",
        description: error.message,
      });
    }
  });

  // Handle campaign deletion
  const handleDelete = () => {
    deleteMutation.mutate({ id: campaign.id });
  };

  // Handle status toggle (active/paused)
  const handleToggleStatus = () => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setIsToggling(true);
    updateStatusMutation.mutate({ 
      id: campaign.id, 
      status: newStatus 
    });
  };

  // Get status badge style
  const getStatusBadge = (status: AutoDMCampaignStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Active
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Paused
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Draft
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Scheduled
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate progress
  const progressPercentage = campaign.totalMessages > 0
    ? Math.round((campaign.sentMessages / campaign.totalMessages) * 100)
    : 0;

  // Platform display
  const getPlatformBadge = (platform: Platform) => {
    const colorMap: Record<string, string> = {
      "onlyfans": "bg-blue-100 text-blue-800",
      "fansly": "bg-purple-100 text-purple-800",
      "instagram": "bg-pink-100 text-pink-800",
      "twitter": "bg-sky-100 text-sky-800",
      "default": "bg-gray-100 text-gray-800"
    };

    const color = colorMap[platform.type.toLowerCase()] || colorMap.default;

    return (
      <Badge variant="outline" className={color}>
        {platform.name}
      </Badge>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-4/5">
              <CardTitle className="line-clamp-1">{campaign.name}</CardTitle>
              <CardDescription>
                Created on {format(new Date(campaign.createdAt), "MMM d, yyyy")}
              </CardDescription>
            </div>
            {getStatusBadge(campaign.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="flex items-center gap-2">
            {getPlatformBadge(campaign.platform)}
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">
                Target: {campaign.targetAudience}
              </span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4 mr-2" />
              <span>
                {format(new Date(campaign.startDate), "MMM d, yyyy")}
                {campaign.endDate && ` → ${format(new Date(campaign.endDate), "MMM d, yyyy")}`}
              </span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>
                Frequency: {campaign.frequency} messages per day
              </span>
            </div>
          </div>

          {["ACTIVE", "PAUSED", "COMPLETED"].includes(campaign.status) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{campaign.sentMessages} sent</span>
                <span>{campaign.totalMessages} total</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 border-t flex justify-between items-center">
          {["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED"].includes(campaign.status) && (
            <Button
              variant={campaign.status === "ACTIVE" ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              disabled={isToggling || ["DRAFT", "SCHEDULED"].includes(campaign.status)}
              className={
                campaign.status === "ACTIVE" 
                  ? "border-yellow-300 text-yellow-800 hover:bg-yellow-50" 
                  : undefined
              }
            >
              {campaign.status === "ACTIVE" ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 