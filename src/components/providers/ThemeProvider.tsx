"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { lightThemeMap, darkThemeMap } from "@/lib/themes"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: "light" | "dark" | "system"
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Apply theme CSS variables
  useEffect(() => {
    setMounted(true)
    
    // Apply CSS variables to :root
    const applyTheme = (theme: string) => {
      const root = document.documentElement
      const themeMap = theme === 'dark' ? darkThemeMap : lightThemeMap
      
      // Apply each CSS variable
      Object.entries(themeMap).forEach(([key, value]) => {
        root.style.setProperty(key, value as string)
      })
    }
    
    // Handle system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme === 'system' || !storedTheme) {
        applyTheme(mediaQuery.matches ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }
    
    // Initialize based on stored preference or system
    const storedTheme = localStorage.getItem('theme') || defaultTheme
    if (storedTheme === 'system') {
      const isDark = mediaQuery.matches
      applyTheme(isDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', isDark)
    } else {
      applyTheme(storedTheme)
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    }
    
    // Listen for system preference changes
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [defaultTheme])

  // Handle theme changes from next-themes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue || defaultTheme
        if (newTheme === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.toggle('dark', isDark)
        } else {
          document.documentElement.classList.toggle('dark', newTheme === 'dark')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [defaultTheme])

  // Avoid rendering with wrong theme
  if (!mounted) {
    return <>{children}</>
  }
  
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
} 