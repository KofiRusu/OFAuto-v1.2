'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@prisma/client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  ChevronRight,
  Users,
  LayoutDashboard,
  Settings,
  FileText,
  MessageSquare,
  ShieldAlert,
  Shield,
  User
} from "lucide-react";

interface RoleBasedOnboardingProps {
  isFirstLogin?: boolean;
  onComplete?: () => void;
}

export function RoleBasedOnboarding({ isFirstLogin = false, onComplete }: RoleBasedOnboardingProps) {
  const { isLoaded, user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(isFirstLogin);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user role
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`);
        const data = await response.json();
        
        if (data.role) {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserRole();
  }, [isLoaded, user]);
  
  // Define onboarding steps based on role
  const getOnboardingSteps = () => {
    if (userRole === UserRole.ADMIN) {
      return [
        {
          title: "Welcome, Administrator",
          description: "You have full access to the OFAuto platform. Let's get you set up with the key admin features.",
          icon: <ShieldAlert className="h-8 w-8 text-purple-600" />,
        },
        {
          title: "User Management",
          description: "As an admin, you can manage users and their roles. Visit the User Management page to add new users or modify existing ones.",
          icon: <Users className="h-8 w-8 text-purple-600" />,
          actionLabel: "Explore User Management",
          actionLink: "/dashboard/users"
        },
        {
          title: "System Settings",
          description: "Configure system-wide settings and preferences to customize the platform for your organization.",
          icon: <Settings className="h-8 w-8 text-purple-600" />,
          actionLabel: "Configure Settings",
          actionLink: "/dashboard/settings"
        },
        {
          title: "Analytics & Reports",
          description: "Access comprehensive analytics and custom reports to monitor platform performance.",
          icon: <LayoutDashboard className="h-8 w-8 text-purple-600" />,
          actionLabel: "View Analytics",
          actionLink: "/dashboard/insights"
        }
      ];
    } else if (userRole === UserRole.MANAGER) {
      return [
        {
          title: "Welcome, Manager",
          description: "You have enhanced access to manage content and settings across multiple clients.",
          icon: <Shield className="h-8 w-8 text-blue-600" />,
        },
        {
          title: "Client Management",
          description: "As a manager, you can oversee multiple clients and their content strategies.",
          icon: <Users className="h-8 w-8 text-blue-600" />,
          actionLabel: "Manage Clients",
          actionLink: "/dashboard/clients"
        },
        {
          title: "Content Planning",
          description: "Create and manage content plans across platforms and clients.",
          icon: <FileText className="h-8 w-8 text-blue-600" />,
          actionLabel: "Plan Content",
          actionLink: "/dashboard/content"
        },
        {
          title: "Analytics & Insights",
          description: "Access advanced analytics to optimize content performance.",
          icon: <LayoutDashboard className="h-8 w-8 text-blue-600" />,
          actionLabel: "View Insights",
          actionLink: "/dashboard/insights"
        }
      ];
    } else {
      // Default USER role
      return [
        {
          title: "Welcome to OFAuto",
          description: "Let's get you set up to manage your social media content effectively.",
          icon: <User className="h-8 w-8 text-gray-600" />,
        },
        {
          title: "Connect Your Platforms",
          description: "Connect your social media accounts to start scheduling and managing content.",
          icon: <MessageSquare className="h-8 w-8 text-gray-600" />,
          actionLabel: "Connect Platforms",
          actionLink: "/dashboard/platforms"
        },
        {
          title: "Create Your First Post",
          description: "Start creating and scheduling content for your connected platforms.",
          icon: <FileText className="h-8 w-8 text-gray-600" />,
          actionLabel: "Create Content",
          actionLink: "/dashboard/content"
        },
        {
          title: "View Your Dashboard",
          description: "Monitor your content performance and get insights to improve engagement.",
          icon: <LayoutDashboard className="h-8 w-8 text-gray-600" />,
          actionLabel: "Go to Dashboard",
          actionLink: "/dashboard"
        }
      ];
    }
  };
  
  const steps = getOnboardingSteps() || [];
  const totalSteps = steps.length;
  
  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    setShowOnboarding(false);
    if (onComplete) {
      onComplete();
    }
    
    // In a real app, you'd want to save the onboarding completed state
    // to the user's profile in the database
    try {
      localStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };
  
  if (!showOnboarding || isLoading || !userRole) {
    return null;
  }
  
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto p-2 rounded-full bg-primary/10 mb-4">
            {currentStepData.icon}
          </div>
          <DialogTitle className="text-xl text-center">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
        
        {currentStepData.actionLabel && currentStepData.actionLink && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <a href={currentStepData.actionLink} target="_blank" rel="noopener">
                {currentStepData.actionLabel} <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between">
          {currentStep > 0 ? (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
          ) : (
            <div></div> // Empty div to maintain layout with justify-between
          )}
          <Button onClick={handleNextStep}>
            {currentStep < totalSteps - 1 ? (
              <>Next</>
            ) : (
              <>
                Complete <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 