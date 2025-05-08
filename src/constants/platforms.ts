import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Paintbrush, 
  SquareCode, 
  Reddit, 
  PinterestIcon 
} from "lucide-react";

export interface PlatformConfig {
  value: string;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  { 
    value: "twitter", 
    label: "Twitter", 
    color: "bg-sky-500",
    icon: Twitter
  },
  { 
    value: "facebook", 
    label: "Facebook", 
    color: "bg-blue-600",
    icon: Facebook
  },
  { 
    value: "instagram", 
    label: "Instagram", 
    color: "bg-pink-600",
    icon: Instagram
  },
  { 
    value: "linkedin", 
    label: "LinkedIn", 
    color: "bg-blue-700",
    icon: Linkedin
  },
  { 
    value: "youtube", 
    label: "YouTube", 
    color: "bg-red-600",
    icon: Youtube
  },
  { 
    value: "tiktok", 
    label: "TikTok", 
    color: "bg-black",
    icon: SquareCode
  },
  { 
    value: "reddit", 
    label: "Reddit", 
    color: "bg-orange-500",
    icon: Reddit
  },
  { 
    value: "threads", 
    label: "Threads", 
    color: "bg-neutral-800",
    icon: Paintbrush
  },
  { 
    value: "pinterest", 
    label: "Pinterest", 
    color: "bg-red-700",
    icon: PinterestIcon
  }
];

export const getPlatformConfig = (platform: string): PlatformConfig => {
  return PLATFORM_CONFIGS.find(config => config.value === platform) || PLATFORM_CONFIGS[0];
};

export const getPlatformColor = (platform: string): string => {
  return getPlatformConfig(platform).color;
};

export const getPlatformLabel = (platform: string): string => {
  return getPlatformConfig(platform).label;
};

export const getPlatformIcon = (platform: string): React.ComponentType<{ className?: string }> => {
  return getPlatformConfig(platform).icon;
}; 