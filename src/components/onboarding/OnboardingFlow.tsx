import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  User, 
  Building2, 
  Link2, 
  Sparkles, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Users,
  TrendingUp,
  AlertCircle,
  type LucideIcon 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: React.ReactNode;
  isOptional?: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isExiting, setIsExiting] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to OFAuto',
      description: 'Let\'s get you set up in just a few minutes',
      icon: Sparkles,
      component: <WelcomeStep />
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us a bit about yourself',
      icon: User,
      component: <ProfileStep />
    },
    {
      id: 'organization',
      title: 'Set Up Your Organization',
      description: 'Create or join an organization',
      icon: Building2,
      component: <OrganizationStep />
    },
    {
      id: 'platforms',
      title: 'Connect Your Platforms',
      description: 'Link your content platforms to get started',
      icon: Link2,
      component: <PlatformsStep />
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStepData.id));
    
    if (currentStep < steps.length - 1) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsExiting(false);
      }, 200);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsExiting(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <button
              onClick={handleSkip}
              className="hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(step.id);
            const isPast = index < currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <button
                  onClick={() => isPast && setCurrentStep(index)}
                  disabled={!isPast}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isActive && "border-primary bg-primary text-primary-foreground scale-110",
                    isCompleted && !isActive && "border-primary bg-primary/10 text-primary",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground",
                    isPast && "cursor-pointer hover:scale-105"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      isPast ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card
          className={cn(
            "transition-all duration-200",
            isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
          )}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <currentStepData.icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {currentStepData.component}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="min-w-[100px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="min-w-[100px]"
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium">
          Welcome to the most powerful content automation platform
        </h3>
        <p className="text-muted-foreground">
          We'll help you automate your content management, grow your audience, 
          and maximize your revenue across all platforms.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Sparkles}
          title="AI-Powered"
          description="Smart automation that learns from your content"
        />
        <FeatureCard
          icon={Users}
          title="Multi-Platform"
          description="Manage all your platforms from one place"
        />
        <FeatureCard
          icon={TrendingUp}
          title="Analytics"
          description="Track performance and optimize your strategy"
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          This setup takes about 5 minutes and you can always change these settings later
        </p>
      </div>
    </div>
  );
};

const ProfileStep: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="How should we address you?"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Your Role</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2">
            <option>Content Creator</option>
            <option>Agency Manager</option>
            <option>Social Media Manager</option>
            <option>Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Primary Goal</label>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="radio" name="goal" className="text-primary" />
              <span>Grow my audience</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="radio" name="goal" className="text-primary" />
              <span>Increase revenue</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="radio" name="goal" className="text-primary" />
              <span>Save time with automation</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrganizationStep: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Organizations help you collaborate with your team
        </p>
      </div>
      
      <div className="grid gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Create New Organization</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Start fresh with your own organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Join Existing Organization</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter an invitation code to join a team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
        <Badge variant="secondary">You can always create or join organizations later</Badge>
      </div>
    </div>
  );
};

const PlatformsStep: React.FC = () => {
  const platforms = [
    { name: 'OnlyFans', connected: false, color: 'bg-[#00AFF0]' },
    { name: 'Fansly', connected: false, color: 'bg-[#1DA1F2]' },
    { name: 'Instagram', connected: false, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'Twitter', connected: false, color: 'bg-[#1DA1F2]' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Connect at least one platform to get started
        </p>
      </div>
      
      <div className="grid gap-3">
        {platforms.map((platform) => (
          <Card
            key={platform.name}
            className="cursor-pointer hover:border-primary transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-full", platform.color)} />
                  <div>
                    <h4 className="font-medium">{platform.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {platform.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={platform.connected ? "secondary" : "default"}
                  size="sm"
                >
                  {platform.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Alert>
        <AlertDescription>
          Don't worry, your credentials are encrypted and secure. You can manage 
          connections anytime from your dashboard.
        </AlertDescription>
      </Alert>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => {
  return (
    <div className="text-center space-y-2 p-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export { OnboardingFlow };