'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Settings, 
  Calendar, 
  BarChart, 
  Bot, 
  Beaker, 
  RefreshCw,
  CirclePlay,
  InfoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Define the onboarding steps with more details and visual guidance
const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to OFAuto!',
    description: 'Your all-in-one platform for content automation, AI-driven insights, and cross-platform management. Let\'s take a quick tour to help you get started.',
    image: '/images/welcome-illustration.svg', // This would need to be created/added
    cta: 'Start Tour',
    path: '/dashboard',
    highlight: null,
    showVideo: true,
    videoId: 'intro-video',
  },
  {
    id: 'connect-platform',
    title: 'Connect Your Platforms',
    description: 'Link your OnlyFans, Instagram, Twitter, and more. The more platforms you connect, the more powerful your automation becomes.',
    image: '/images/connect-platforms.svg', // This would need to be created/added
    cta: 'Go to Credentials',
    path: '/dashboard/credentials',
    highlight: 'platform-connect-card',
    icon: <Settings className="h-5 w-5" />,
    steps: [
      'Click on "Add Platform" to connect a new account',
      'Follow the authentication prompts',
      'Configure your sync preferences for each platform'
    ]
  },
  {
    id: 'schedule-post',
    title: 'Content Scheduling',
    description: 'Plan and schedule content across all your platforms. Create once, publish everywhere with our unified calendar.',
    image: '/images/schedule-content.svg', // This would need to be created/added
    cta: 'Go to Scheduler',
    path: '/dashboard/scheduler',
    highlight: 'scheduler-button',
    icon: <Calendar className="h-5 w-5" />,
    steps: [
      'Drag and drop content to your preferred date',
      'Configure platform-specific settings',
      'Set your publishing schedule with AI-recommended times'
    ]
  },
  {
    id: 'view-insights',
    title: 'AI-Powered Insights',
    description: 'Get personalized analytics and content recommendations. Our AI analyzes your performance across platforms to suggest improvements.',
    image: '/images/insights-preview.svg', // This would need to be created/added
    cta: 'View Insights',
    path: '/dashboard/insights',
    highlight: 'insights-card',
    icon: <BarChart className="h-5 w-5" />,
    steps: [
      'Review your key performance indicators',
      'Explore audience behavior patterns',
      'Discover AI-generated content suggestions'
    ]
  },
  {
    id: 'experiments',
    title: 'Optimize with Experiments',
    description: 'Test different approaches to content, pricing, and outreach. Our A/B testing framework helps you find what works best for your audience.',
    image: '/images/experiments.svg', // This would need to be created/added
    cta: 'Try Experiments',
    path: '/dashboard/experiments',
    highlight: 'experiment-card',
    icon: <Beaker className="h-5 w-5" />,
    steps: [
      'Create an experiment with two content variations',
      'Select your target audience and goals',
      'Let our system track results and declare a winner'
    ]
  },
  {
    id: 'automation',
    title: 'Set Up Automations',
    description: 'Create triggers and actions that run on autopilot. Build your own workflows or use our pre-configured templates.',
    image: '/images/automation.svg', // This would need to be created/added
    cta: 'Set Up Automations',
    path: '/dashboard/automation',
    highlight: 'automation-card',
    icon: <Bot className="h-5 w-5" />,
    steps: [
      'Select a trigger event (new follower, milestone, etc.)',
      'Choose the action to perform automatically',
      'Set conditions and customize your workflow'
    ]
  },
  {
    id: 'completion',
    title: 'You\'re Ready to Go!',
    description: 'You\'ve completed the tour and are ready to start automating your content. Remember, you can restart this tutorial anytime from Settings.',
    image: '/images/completion.svg', // This would need to be created/added
    cta: 'Finish',
    path: '/dashboard',
    highlight: null,
    icon: <Sparkles className="h-5 w-5" />,
    showConfetti: true,
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  forceStart?: boolean;
}

export function OnboardingTour({ onComplete, forceStart = false }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  const currentStep = onboardingSteps[currentStepIndex];
  const progress = ((currentStepIndex) / (onboardingSteps.length - 1)) * 100;

  // Check if onboarding was completed previously
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const shouldStartOnboarding = forceStart || !onboardingCompleted;
    
    if (shouldStartOnboarding) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [forceStart]);

  // Handle navigation between steps
  const navigateToStep = (step: typeof currentStep) => {
    // Clean up any existing highlighted elements
    if (highlightedElement) {
      highlightedElement.classList.remove('onboarding-highlight');
      setHighlightedElement(null);
    }
    
    // If the current path is different from the step path, navigate
    if (pathname !== step.path) {
      router.push(step.path);
      
      // Give time for the page to load before highlighting
      setTimeout(() => {
        if (step.highlight) {
          highlightElement(step.highlight);
        }
      }, 500);
    } else {
      // Highlight immediately if we're already on the right page
      if (step.highlight) {
        highlightElement(step.highlight);
      }
    }
  };

  // Highlight an element on the page
  const highlightElement = (elementId: string) => {
    // Remove any existing highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });

    // Add highlight to target element
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('onboarding-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedElement(element);
      setShowTooltip(true);
      
      // Create an overlay to emphasize the highlighted element
      if (overlayRef.current) {
        const rect = element.getBoundingClientRect();
        overlayRef.current.style.display = 'block';
      }
    }
  };

  // Handle next step
  const handleNext = () => {
    // Reset tooltip state
    setShowTooltip(false);
    
    if (currentStepIndex < onboardingSteps.length - 1) {
      const nextStep = onboardingSteps[currentStepIndex + 1];
      navigateToStep(nextStep);
      setCurrentStepIndex(currentStepIndex + 1);
      
      // Reset video playing state
      setIsVideoPlaying(false);
    } else {
      completeOnboarding();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    // Reset tooltip state
    setShowTooltip(false);
    
    if (currentStepIndex > 0) {
      const prevStep = onboardingSteps[currentStepIndex - 1];
      navigateToStep(prevStep);
      setCurrentStepIndex(currentStepIndex - 1);
      
      // Reset video playing state
      setIsVideoPlaying(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    completeOnboarding();
  };

  // Toggle video playback
  const toggleVideo = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  // Complete onboarding
  const completeOnboarding = () => {
    // Remove any highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    // Hide the overlay
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
    }
    
    // Reset state
    setHighlightedElement(null);
    setShowTooltip(false);
    
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    
    // Close the dialog
    setIsOpen(false);
    
    // Trigger confetti on completion if on the last step
    if (currentStepIndex === onboardingSteps.length - 1 && currentStep.showConfetti) {
      // This would need a confetti library implementation
      console.log('🎉 Confetti!');
    }
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
  };

  // Reset onboarding (for use in settings)
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  // Clean up on dialog close
  useEffect(() => {
    if (!isOpen) {
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
      
      setHighlightedElement(null);
      setShowTooltip(false);
      
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Highlight overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 pointer-events-none hidden"
        aria-hidden="true"
      />
      
      {/* Tooltip for highlighted element */}
      {showTooltip && highlightedElement && currentStep.steps && (
        <div 
          className="fixed z-50 bg-card border rounded-lg shadow-lg p-4 max-w-xs animate-fade-in"
          style={{
            top: `${highlightedElement.getBoundingClientRect().top + window.scrollY + highlightedElement.getBoundingClientRect().height + 10}px`,
            left: `${highlightedElement.getBoundingClientRect().left + window.scrollX + (highlightedElement.getBoundingClientRect().width / 2) - 150}px`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              {currentStep.icon || <InfoIcon className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h4 className="font-medium text-sm">{currentStep.title}</h4>
              <ul className="mt-2 space-y-2">
                {currentStep.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary h-4 w-4 text-xs mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs w-full"
                onClick={() => setShowTooltip(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <div className={cn(
            "p-6 transition-colors",
            currentStepIndex === 0 || currentStepIndex === onboardingSteps.length - 1 
              ? "bg-primary/20 dark:bg-primary/10" 
              : "bg-primary/10"
          )}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {currentStep.icon && <span className="text-primary">{currentStep.icon}</span>}
                {currentStep.title}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-muted-foreground">{currentStep.description}</p>
            
            {currentStep.image && !isVideoPlaying && (
              <div className="mt-4 rounded-lg overflow-hidden bg-card/50 h-32 flex items-center justify-center">
                {/* This would display the step illustration if available */}
                <div className="text-sm text-muted-foreground">Step illustration placeholder</div>
              </div>
            )}
            
            {currentStep.showVideo && (
              <div className="mt-4">
                {isVideoPlaying ? (
                  <div className="rounded-lg overflow-hidden bg-black h-48 flex items-center justify-center">
                    <div className="text-sm text-white/70">Video player placeholder</div>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full h-10 gap-2"
                    onClick={toggleVideo}
                  >
                    <CirclePlay className="h-4 w-4" />
                    Watch Introduction Video
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {onboardingSteps.length}
              </div>
              <Progress value={progress} className="w-32 h-2" />
            </div>

            <DialogFooter className="gap-2 flex sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                >
                  Skip Tour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
              </div>
              <Button size="sm" onClick={handleNext} className={cn(
                "transition-all",
                currentStepIndex === onboardingSteps.length - 1 && "bg-primary hover:bg-primary/90"
              )}>
                {currentStepIndex < onboardingSteps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 50;
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.3), 0 0 0 8px rgba(var(--primary-rgb), 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.3), 0 0 0 8px rgba(var(--primary-rgb), 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0.3), 0 0 0 16px rgba(var(--primary-rgb), 0.2);
          }
          100% {
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.3), 0 0 0 8px rgba(var(--primary-rgb), 0.2);
          }
        }
      `}</style>
    </>
  );
}

// Export a function to reset the onboarding
export function resetOnboarding() {
  localStorage.removeItem('onboarding_completed');
  window.location.href = '/dashboard'; // Redirect to dashboard to restart
}

// Export a function to check if onboarding is completed
export function isOnboardingCompleted() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('onboarding_completed') === 'true';
  }
  return false;
} 