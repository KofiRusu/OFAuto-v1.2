'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, StepTitle, StepDescription, StepSeparator } from "@/components/ui/stepper"; // Assuming a Stepper component exists
import { Check, UserCog, Plug, Calendar, Bot, Loader2 } from "lucide-react";
import Link from 'next/link';

// Mock API to update user profile
async function markOnboardingCompleteApi(): Promise<{ success: boolean }> {
    console.log("Marking onboarding complete...");
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
}

const steps = [
  { id: 'welcome', title: 'Welcome to OFAuto!', description: 'Your AI-powered automation platform.', icon: Bot },
  { id: 'persona', title: 'Configure Your AI Persona', description: 'Define how your AI communicates.', icon: UserCog, link: '/dashboard/settings/persona' },
  { id: 'integrations', title: 'Connect Your Platforms', description: 'Link OnlyFans, Fansly, etc.', icon: Plug, link: '/dashboard/integrations' },
  { id: 'scheduler', title: 'Schedule Your First Post', description: 'Plan and automate content.', icon: Calendar, link: '/dashboard/scheduler' },
  { id: 'ready', title: "You're All Set!", description: 'Start automating and growing.', icon: Check },
];

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void; // Also marks onboarding as complete
}

export default function OnboardingTourModal({ isOpen, onClose }: OnboardingTourModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await markOnboardingCompleteApi();
      onClose(); // Close the modal and update state in parent
    } catch (error) {
      console.error("Failed to mark onboarding complete");
      // Handle error appropriately - maybe allow closing anyway?
    } finally {
      setIsCompleting(false);
    }
  };

  const CurrentIcon = steps[activeStep].icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && activeStep === steps.length -1 && handleComplete()}> 
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
           <DialogTitle className="text-center text-xl mb-2">Platform Quick Start</DialogTitle>
           {/* Stepper Integration */}
           <Stepper index={activeStep} className="w-full px-4 py-2">
                {steps.map((step, index) => (
                    <Step key={step.id} index={index}>
                        <StepIndicator>
                            <StepStatus 
                                complete={<StepIcon />} 
                                incomplete={<StepNumber />} 
                                active={<StepNumber />} 
                            />
                        </StepIndicator>
                        <div className="sr-only">
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                        </div>
                        <StepSeparator />
                    </Step>
                ))}
            </Stepper>
        </DialogHeader>
        
        <div className="py-6 text-center min-h-[150px] flex flex-col items-center justify-center">
            <CurrentIcon size={40} className="mb-4 text-primary"/>
            <h3 className="text-lg font-semibold mb-1">{steps[activeStep].title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{steps[activeStep].description}</p>
            {steps[activeStep].link && (
                <Link href={steps[activeStep].link!} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Go to {steps[activeStep].title.split(' ')[0]}</Button>
                </Link>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full">
          <Button variant="ghost" onClick={handleBack} disabled={activeStep === 0 || isCompleting}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
              I'm Ready!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 