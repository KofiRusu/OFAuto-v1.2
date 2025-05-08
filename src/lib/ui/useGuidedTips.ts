import { useState, useEffect } from 'react';
import { isOnboardingCompleted } from '@/components/ui/OnboardingTour';

export type TipLocation = 
  | 'dashboard-overview'
  | 'platform-connect'
  | 'scheduler'
  | 'insights'
  | 'experiments'
  | 'automation'
  | 'settings';

// Track which tips have been shown
const TIPS_STORAGE_KEY = 'shown_guided_tips';

interface UseGuidedTipsProps {
  location: TipLocation;
  forceShow?: boolean;
}

export function useGuidedTips({ location, forceShow = false }: UseGuidedTipsProps) {
  const [shouldShowTips, setShouldShowTips] = useState<boolean>(false);
  const [shownTips, setShownTips] = useState<string[]>([]);

  useEffect(() => {
    // Get tips settings
    const tipsEnabled = localStorage.getItem('tips_enabled') !== 'false';
    const onboardingDone = isOnboardingCompleted();
    const shownTipsString = localStorage.getItem(TIPS_STORAGE_KEY);
    
    // Parse shown tips
    const shownTipsList = shownTipsString ? JSON.parse(shownTipsString) : [];
    setShownTips(shownTipsList);
    
    // Show tips if they're enabled and we haven't shown too many
    const shouldShow = forceShow || (tipsEnabled && (onboardingDone || shownTipsList.length < 10));
    setShouldShowTips(shouldShow);
  }, [forceShow, location]);

  const markTipAsShown = (tipId: string) => {
    // Add to local state
    const updatedShownTips = [...shownTips, tipId];
    setShownTips(updatedShownTips);
    
    // Save to localStorage
    localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(updatedShownTips));
  };

  const checkTip = (tipId: string): boolean => {
    if (!shouldShowTips) return false;
    
    // Don't show tips that have already been shown
    if (shownTips.includes(tipId)) return false;
    
    return true;
  };

  // Reset all shown tips
  const resetTips = () => {
    localStorage.removeItem(TIPS_STORAGE_KEY);
    setShownTips([]);
  };

  // Disable or enable tips
  const setTipsEnabled = (enabled: boolean) => {
    localStorage.setItem('tips_enabled', enabled ? 'true' : 'false');
    setShouldShowTips(enabled);
  };

  return {
    shouldShowTips,
    checkTip,
    markTipAsShown,
    resetTips,
    setTipsEnabled,
  };
} 