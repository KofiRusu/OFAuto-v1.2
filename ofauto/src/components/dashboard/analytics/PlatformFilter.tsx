'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Platform } from "@/lib/types"; // Assuming a shared types file exists or we define it here

// Define Platform type if not imported
// export type Platform = 'all' | 'onlyfans' | 'fansly' | 'patreon' | 'kofi' | 'instagram' | 'twitter';

const platforms: Platform[] = ['all', 'onlyfans', 'fansly', 'patreon', 'kofi', 'instagram', 'twitter'];

interface PlatformFilterProps {
  selectedPlatform: Platform | 'all';
  onPlatformChange: (platform: Platform | 'all') => void;
  disabled?: boolean;
}

export default function PlatformFilter({ 
  selectedPlatform, 
  onPlatformChange,
  disabled = false 
}: PlatformFilterProps) {
  return (
    <div className="flex items-center gap-2">
       <Label htmlFor="platform-filter" className="text-sm font-medium whitespace-nowrap">Platform:</Label>
       <Select 
         value={selectedPlatform} 
         onValueChange={(value) => onPlatformChange(value as Platform | 'all')}
         disabled={disabled}
       >
         <SelectTrigger id="platform-filter" className="w-[160px] h-9">
           <SelectValue placeholder="Select Platform" />
         </SelectTrigger>
         <SelectContent>
           {platforms.map(p => (
             <SelectItem key={p} value={p} className="capitalize">
               {p === 'all' ? 'All Platforms' : p}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
    </div>
  );
} 