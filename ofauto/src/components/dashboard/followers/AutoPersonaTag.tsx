import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoPersonaTagProps {
  personaName: string | null | undefined;
  showIcon?: boolean;
  truncate?: boolean;
  className?: string;
}

// Define persona properties with colors and descriptions
const personaConfig: Record<string, { variant: string, description: string }> = {
  'flirty': { 
    variant: 'success', 
    description: 'Playful and flirtatious tone, ideal for engagement and building attraction.'
  },
  'playful': { 
    variant: 'success', 
    description: 'Light and fun communication style that creates a relaxed atmosphere.'
  },
  'dominant': { 
    variant: 'error', 
    description: 'Confident and authoritative tone that emphasizes control and direction.'
  },
  'assertive': { 
    variant: 'error', 
    description: 'Direct and firm communication that sets clear boundaries and expectations.'
  },
  'chill': { 
    variant: 'info', 
    description: 'Casual and relaxed tone that makes followers feel comfortable.'
  },
  'friendly': { 
    variant: 'info', 
    description: 'Warm and approachable style that focuses on creating a connection.'
  },
  'sweet': { 
    variant: 'warning', 
    description: 'Gentle and kind communication that emphasizes care and appreciation.'
  },
  'caring': { 
    variant: 'warning', 
    description: 'Supportive and nurturing tone that makes followers feel valued.'
  },
  'custom': { 
    variant: 'secondary', 
    description: 'A personalized communication style tailored to your specific needs.'
  },
  'vibe': { 
    variant: 'secondary', 
    description: 'A unique tone designed to match your personal brand identity.'
  },
  'default': { 
    variant: 'outline', 
    description: 'Standard messaging tone used for general communication.'
  }
};

// Helper function to determine persona variant
const getPersonaType = (name: string): { variant: string, description: string } => {
  if (!name) return personaConfig['default'];
  
  const lowerName = name.toLowerCase();
  
  // Check if the persona name contains any of our known keywords
  for (const [key, config] of Object.entries(personaConfig)) {
    if (lowerName.includes(key)) {
      return config;
    }
  }
  
  return personaConfig['default'];
};

export default function AutoPersonaTag({ 
  personaName, 
  showIcon = true, 
  truncate = false,
  className
}: AutoPersonaTagProps) {
  if (!personaName) {
    return null; // Don't render if no persona was used
  }

  const { variant, description } = getPersonaType(personaName);
  const displayName = truncate && personaName.length > 12 
    ? `${personaName.substring(0, 10)}...` 
    : personaName;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant as any} 
            className={cn(
              "text-xs px-2 py-0.5 font-normal whitespace-nowrap", 
              className
            )}
          >
            {showIcon && <Brain size={10} className="mr-1" />}
            {displayName}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          <p><strong>Persona:</strong> {personaName}</p>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 