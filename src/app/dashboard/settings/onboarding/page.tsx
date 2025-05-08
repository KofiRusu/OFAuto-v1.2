'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Switch 
} from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  PlayCircle, 
  RotateCcw, 
  AlertTriangle, 
  HelpCircle, 
  LucideComponentProps, 
  Check 
} from 'lucide-react';
import { resetOnboarding } from '@/components/ui/OnboardingTour';
import { useGuidedTips } from '@/lib/ui/useGuidedTips';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingSettingsPage() {
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const { setTipsEnabled: setTipsEnabledGlobal, resetTips } = useGuidedTips({ location: 'settings' });
  const { toast } = useToast();

  // Initialize state from localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem('tips_enabled');
    setTipsEnabled(storedValue !== 'false');
  }, []);

  // Handle tips toggle
  const handleToggleTips = (enabled: boolean) => {
    setTipsEnabled(enabled);
    setTipsEnabledGlobal(enabled);
    
    toast({
      title: enabled ? 'Guided tips enabled' : 'Guided tips disabled',
      description: enabled 
        ? 'Helpful tips will be shown throughout the app.' 
        : 'You can re-enable guided tips here anytime.',
    });
  };

  // Handle onboarding reset
  const handleResetOnboarding = () => {
    resetOnboarding();
    resetTips();
    setShowConfirmReset(false);
    
    toast({
      title: 'Onboarding reset',
      description: 'The onboarding experience will restart next time you visit the dashboard.',
      variant: 'default',
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Onboarding & Help Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Guided Tours & Help</CardTitle>
            <CardDescription>
              Configure how the platform guides and assists you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tips-toggle">Contextual Tips</Label>
                  <div className="text-sm text-muted-foreground">
                    Show guided tooltips throughout the application
                  </div>
                </div>
                <Switch 
                  id="tips-toggle" 
                  checked={tipsEnabled} 
                  onCheckedChange={handleToggleTips} 
                />
              </div>

              <div className="flex items-start justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Onboarding Experience</Label>
                  <div className="text-sm text-muted-foreground">
                    Reset the onboarding tour to see it again
                  </div>
                </div>
                {showConfirmReset ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowConfirmReset(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleResetOnboarding}
                    >
                      Confirm Reset
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowConfirmReset(true)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Tour
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-md bg-muted p-4 mt-6">
              <div className="flex gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Need immediate help?</p>
                  <p className="text-sm text-muted-foreground">
                    Press <kbd className="rounded border px-1">Ctrl</kbd> + <kbd className="rounded border px-1">K</kbd> anywhere to access the command palette with shortcuts to all app features.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      resetOnboarding();
                      toast({
                        title: 'Restart tour now',
                        description: 'Redirecting to dashboard to begin the tour...',
                      });
                      setTimeout(() => {
                        window.location.href = '/dashboard';
                      }, 1000);
                    }}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Tour Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Guidance Options</CardTitle>
            <CardDescription>
              Other settings related to the onboarding experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <GuidanceOption
                title="Show keyboard shortcuts"
                description="Display keyboard shortcut hints throughout the application"
                icon={HelpCircle}
                enabled={true}
              />
              
              <GuidanceOption
                title="Show feature updates"
                description="Get notified about new features and improvements"
                icon={AlertTriangle}
                enabled={true}
              />
              
              <GuidanceOption
                title="Analytics recommendations"
                description="Receive personalized guidance based on your analytics"
                icon={Check}
                enabled={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface GuidanceOptionProps {
  title: string;
  description: string;
  icon: React.ComponentType<LucideComponentProps>;
  enabled: boolean;
}

function GuidanceOption({ title, description, icon: Icon, enabled }: GuidanceOptionProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <Label>{title}</Label>
          <div className="text-sm text-muted-foreground">
            {description}
          </div>
        </div>
      </div>
      <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
    </div>
  );
} 