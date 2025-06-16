/**
 * OFAuto Design Tokens
 * Comprehensive design system tokens for consistent UI/UX
 */

export const designTokens = {
  // Brand Colors for Platform-Specific UI
  brand: {
    onlyfans: {
      DEFAULT: '#00AFF0',
      light: '#4DC7F5',
      dark: '#0090C7',
      bg: '#E6F7FF',
      contrast: '#FFFFFF',
    },
    fansly: {
      DEFAULT: '#1DA1F2',
      light: '#5CB8F5',
      dark: '#0E7FC4',
      bg: '#E8F5FE',
      contrast: '#FFFFFF',
    },
    kofi: {
      DEFAULT: '#FF5E5B',
      light: '#FF8A88',
      dark: '#E63946',
      bg: '#FFE8E7',
      contrast: '#FFFFFF',
    },
    patreon: {
      DEFAULT: '#FF424D',
      light: '#FF6B72',
      dark: '#E62E3A',
      bg: '#FFE5E7',
      contrast: '#FFFFFF',
    },
  },

  // Status Colors
  status: {
    live: {
      DEFAULT: '#EF4444',
      pulse: '#DC2626',
      bg: '#FEE2E2',
      text: '#991B1B',
    },
    scheduled: {
      DEFAULT: '#8B5CF6',
      light: '#A78BFA',
      bg: '#EDE9FE',
      text: '#5B21B6',
    },
    draft: {
      DEFAULT: '#6B7280',
      light: '#9CA3AF',
      bg: '#F3F4F6',
      text: '#374151',
    },
    published: {
      DEFAULT: '#10B981',
      light: '#34D399',
      bg: '#D1FAE5',
      text: '#065F46',
    },
  },

  // Revenue Colors
  revenue: {
    positive: {
      DEFAULT: '#10B981',
      light: '#34D399',
      dark: '#059669',
      bg: '#D1FAE5',
      text: '#065F46',
    },
    negative: {
      DEFAULT: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      bg: '#FEE2E2',
      text: '#991B1B',
    },
    neutral: {
      DEFAULT: '#6B7280',
      light: '#9CA3AF',
      dark: '#4B5563',
      bg: '#F3F4F6',
      text: '#374151',
    },
  },

  // Typography Scale
  typography: {
    // Font Families
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
    },
    
    // Font Sizes with line heights
    fontSize: {
      // Display sizes
      'display-2xl': ['72px', { lineHeight: '90px', letterSpacing: '-0.02em' }],
      'display-xl': ['60px', { lineHeight: '72px', letterSpacing: '-0.02em' }],
      'display-lg': ['48px', { lineHeight: '60px', letterSpacing: '-0.02em' }],
      'display-md': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      'display-sm': ['30px', { lineHeight: '38px', letterSpacing: '-0.01em' }],
      'display-xs': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
      
      // Text sizes
      'text-xl': ['20px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
      'text-lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
      'text-md': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
      'text-sm': ['14px', { lineHeight: '20px', letterSpacing: '0' }],
      'text-xs': ['12px', { lineHeight: '18px', letterSpacing: '0' }],
    },

    // Font Weights
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing System
  spacing: {
    // Component-specific spacing
    card: {
      padding: '24px',
      paddingSm: '16px',
      paddingLg: '32px',
      gap: '16px',
    },
    section: {
      gap: '48px',
      gapSm: '32px',
      gapLg: '64px',
    },
    inline: {
      gap: '8px',
      gapSm: '4px',
      gapLg: '12px',
    },
    stack: {
      gap: '16px',
      gapSm: '8px',
      gapLg: '24px',
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '4px',
    DEFAULT: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.05)',
    
    // Colored shadows
    primary: '0 4px 14px 0 rgba(59, 130, 246, 0.3)',
    success: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
    error: '0 4px 14px 0 rgba(239, 68, 68, 0.3)',
    
    // Inset shadows
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    'inner-lg': 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
    
    // Easing functions
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    notification: 80,
    commandPalette: 90,
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Animation keyframes
  animations: {
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
    
    // Custom animations
    fadeIn: 'fadeIn 200ms ease-out',
    fadeOut: 'fadeOut 150ms ease-in',
    slideUp: 'slideUp 200ms ease-out',
    slideDown: 'slideDown 200ms ease-out',
    scaleIn: 'scaleIn 200ms ease-out',
    scaleOut: 'scaleOut 150ms ease-in',
    
    // Platform-specific
    liveIndicator: 'liveIndicator 2s ease-in-out infinite',
  },
};

// Type-safe token getter
export function getToken<T extends keyof typeof designTokens>(
  category: T,
  ...path: string[]
): any {
  let current: any = designTokens[category];
  for (const p of path) {
    current = current?.[p];
  }
  return current;
}

// CSS variable generator
export function generateCSSVariables(): string {
  const cssVars: string[] = [];
  
  // Convert nested object to CSS variables
  function processObject(obj: any, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        processObject(value, varName);
      } else if (typeof value === 'string' || typeof value === 'number') {
        cssVars.push(`--${varName}: ${value};`);
      }
    }
  }
  
  processObject(designTokens);
  return cssVars.join('\n  ');
}