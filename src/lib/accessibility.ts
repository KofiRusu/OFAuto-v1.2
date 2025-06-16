/**
 * Accessibility utilities for WCAG compliance
 */

// Convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

// Calculate relative luminance
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b)
  const lum2 = getLuminance(color2.r, color2.g, color2.b)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

// Check if contrast meets WCAG AA standards
export function meetsWCAGAA(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

// Check if contrast meets WCAG AAA standards
export function meetsWCAGAAA(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

// Focus trap utility for modals and dialogs
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )
  const firstFocusableElement = focusableElements[0] as HTMLElement
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleKeyDown = (e: KeyboardEvent) => {
    const isTabPressed = e.key === 'Tab'

    if (!isTabPressed) {
      return
    }

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstFocusableElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// Screen reader announcement utility
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute(
    'style',
    'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;'
  )
  announcement.textContent = message
  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Keyboard navigation helper
export function handleArrowKeyNavigation(
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (newIndex: number) => void,
  options: {
    horizontal?: boolean
    vertical?: boolean
    loop?: boolean
  } = { horizontal: true, vertical: true, loop: true }
) {
  const { horizontal = true, vertical = true, loop = true } = options

  let newIndex = currentIndex

  switch (e.key) {
    case 'ArrowUp':
      if (vertical) {
        e.preventDefault()
        newIndex = currentIndex - 1
      }
      break
    case 'ArrowDown':
      if (vertical) {
        e.preventDefault()
        newIndex = currentIndex + 1
      }
      break
    case 'ArrowLeft':
      if (horizontal) {
        e.preventDefault()
        newIndex = currentIndex - 1
      }
      break
    case 'ArrowRight':
      if (horizontal) {
        e.preventDefault()
        newIndex = currentIndex + 1
      }
      break
    case 'Home':
      e.preventDefault()
      newIndex = 0
      break
    case 'End':
      e.preventDefault()
      newIndex = totalItems - 1
      break
    default:
      return
  }

  // Handle looping
  if (loop) {
    if (newIndex < 0) {
      newIndex = totalItems - 1
    } else if (newIndex >= totalItems) {
      newIndex = 0
    }
  } else {
    newIndex = Math.max(0, Math.min(totalItems - 1, newIndex))
  }

  if (newIndex !== currentIndex) {
    onNavigate(newIndex)
  }
}