/**
 * OFAuto Theme Configuration
 * 
 * This file contains theme configurations for the OFAuto platform.
 * It defines color palettes, typography, and other design tokens
 * that are used throughout the application.
 */

// Main brand colors
export const brandColors = {
  primary: {
    50: 'hsl(221, 100%, 96%)',
    100: 'hsl(223, 95%, 90%)',
    200: 'hsl(223, 95%, 85%)',
    300: 'hsl(223, 90%, 75%)',
    400: 'hsl(223, 85%, 65%)',
    500: 'hsl(224, 83%, 57%)', // Brand primary
    600: 'hsl(225, 86%, 49%)',
    700: 'hsl(226, 88%, 42%)',
    800: 'hsl(228, 88%, 35%)',
    900: 'hsl(230, 88%, 25%)',
    950: 'hsl(232, 90%, 15%)',
  },
  secondary: {
    50: 'hsl(262, 100%, 97%)',
    100: 'hsl(260, 95%, 93%)',
    200: 'hsl(259, 95%, 89%)',
    300: 'hsl(258, 90%, 81%)',
    400: 'hsl(257, 85%, 73%)',
    500: 'hsl(256, 80%, 65%)', // Brand secondary
    600: 'hsl(255, 75%, 58%)',
    700: 'hsl(254, 70%, 50%)',
    800: 'hsl(255, 70%, 40%)',
    900: 'hsl(257, 70%, 30%)',
    950: 'hsl(260, 70%, 20%)',
  },
  neutral: {
    50: 'hsl(220, 20%, 98%)',
    100: 'hsl(220, 15%, 95%)',
    200: 'hsl(220, 15%, 91%)',
    300: 'hsl(220, 10%, 85%)',
    400: 'hsl(220, 10%, 70%)',
    500: 'hsl(220, 10%, 50%)',
    600: 'hsl(220, 10%, 40%)',
    700: 'hsl(222, 15%, 30%)',
    800: 'hsl(224, 20%, 20%)',
    900: 'hsl(226, 25%, 15%)',
    950: 'hsl(228, 30%, 10%)',
  }
};

// Semantic colors
export const semanticColors = {
  success: {
    light: 'hsl(142, 76%, 36%)',
    DEFAULT: 'hsl(142, 71%, 45%)',
    dark: 'hsl(142, 64%, 54%)',
    bg: 'hsl(142, 76%, 95%)',
  },
  warning: {
    light: 'hsl(38, 92%, 40%)',
    DEFAULT: 'hsl(38, 92%, 50%)',
    dark: 'hsl(38, 92%, 60%)',
    bg: 'hsl(38, 92%, 95%)',
  },
  error: {
    light: 'hsl(0, 84%, 45%)',
    DEFAULT: 'hsl(0, 84%, 60%)',
    dark: 'hsl(0, 84%, 70%)',
    bg: 'hsl(0, 84%, 97%)',
  },
  info: {
    light: 'hsl(200, 85%, 45%)',
    DEFAULT: 'hsl(200, 85%, 60%)',
    dark: 'hsl(200, 85%, 70%)',
    bg: 'hsl(200, 85%, 95%)',
  }
};

// Chart colors
export const chartColors = {
  sequential: [
    'hsl(224, 83%, 57%)', // primary-500
    'hsl(256, 80%, 65%)', // secondary-500
    'hsl(180, 80%, 50%)', // teal
    'hsl(335, 80%, 60%)', // pink
    'hsl(32, 95%, 60%)',  // orange
    'hsl(270, 70%, 65%)', // purple
    'hsl(150, 70%, 50%)', // green
    'hsl(0, 75%, 60%)',   // red
  ],
  categorical: [
    'hsl(224, 83%, 57%)', // primary-500
    'hsl(256, 80%, 65%)', // secondary-500
    'hsl(32, 95%, 60%)',  // orange
    'hsl(335, 80%, 60%)', // pink
    'hsl(180, 80%, 50%)', // teal
    'hsl(150, 70%, 50%)', // green
    'hsl(270, 70%, 65%)', // purple
    'hsl(0, 75%, 60%)',   // red
  ]
};

// Shadow definitions
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Theme map for CSS variables
export const lightThemeMap = {
  // Background and foreground
  '--background': brandColors.neutral[50],
  '--foreground': brandColors.neutral[950],
  
  // Card
  '--card': 'white',
  '--card-foreground': brandColors.neutral[900],
  
  // Popover
  '--popover': 'white',
  '--popover-foreground': brandColors.neutral[900],
  
  // Primary
  '--primary': brandColors.primary[500],
  '--primary-foreground': 'white',
  
  // Secondary
  '--secondary': brandColors.secondary[500],
  '--secondary-foreground': 'white',
  
  // Muted
  '--muted': brandColors.neutral[100],
  '--muted-foreground': brandColors.neutral[600],
  
  // Accent
  '--accent': brandColors.primary[100],
  '--accent-foreground': brandColors.primary[900],
  
  // Border and inputs
  '--border': brandColors.neutral[200],
  '--input': brandColors.neutral[200],
  '--ring': brandColors.primary[500],
  
  // Destructive
  '--destructive': semanticColors.error.DEFAULT,
  '--destructive-foreground': 'white',
  
  // Success
  '--success': semanticColors.success.DEFAULT,
  '--success-foreground': 'white',
  
  // Warning
  '--warning': semanticColors.warning.DEFAULT,
  '--warning-foreground': 'white',
  
  // Radius
  '--radius': '0.5rem',
};

export const darkThemeMap = {
  // Background and foreground
  '--background': brandColors.neutral[950],
  '--foreground': brandColors.neutral[100],
  
  // Card
  '--card': brandColors.neutral[900],
  '--card-foreground': brandColors.neutral[100],
  
  // Popover
  '--popover': brandColors.neutral[900],
  '--popover-foreground': brandColors.neutral[100],
  
  // Primary
  '--primary': brandColors.primary[400],
  '--primary-foreground': brandColors.neutral[950],
  
  // Secondary
  '--secondary': brandColors.secondary[400],
  '--secondary-foreground': brandColors.neutral[950],
  
  // Muted
  '--muted': brandColors.neutral[800],
  '--muted-foreground': brandColors.neutral[400],
  
  // Accent
  '--accent': brandColors.primary[900],
  '--accent-foreground': brandColors.primary[100],
  
  // Border and inputs
  '--border': brandColors.neutral[800],
  '--input': brandColors.neutral[800],
  '--ring': brandColors.primary[700],
  
  // Destructive
  '--destructive': semanticColors.error.dark,
  '--destructive-foreground': 'white',
  
  // Success
  '--success': semanticColors.success.dark,
  '--success-foreground': 'white',
  
  // Warning
  '--warning': semanticColors.warning.dark,
  '--warning-foreground': 'white',
  
  // Radius
  '--radius': '0.5rem',
};

// Animation timings
export const animations = {
  fast: '100ms',
  default: '200ms',
  slow: '400ms',
};

// Spacing scale
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
}; 