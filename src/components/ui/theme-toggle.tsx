"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { lightThemeMap, darkThemeMap } from "@/lib/themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Only show the toggler after mounting to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Apply theme CSS variables
  const applyTheme = (newTheme: string) => {
    const root = document.documentElement
    
    // Handle system theme
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const themeMap = systemTheme === 'dark' ? darkThemeMap : lightThemeMap
      
      // Apply each CSS variable
      Object.entries(themeMap).forEach(([key, value]) => {
        root.style.setProperty(key, value as string)
      })
      
      // Toggle dark class
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      // Apply direct theme
      const themeMap = newTheme === 'dark' ? darkThemeMap : lightThemeMap
      
      // Apply each CSS variable
      Object.entries(themeMap).forEach(([key, value]) => {
        root.style.setProperty(key, value as string)
      })
      
      // Toggle dark class
      root.classList.toggle('dark', newTheme === 'dark')
    }
    
    // Set the theme
    setTheme(newTheme)
    
    // Store the theme selection in localStorage
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 