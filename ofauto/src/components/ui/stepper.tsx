"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StepperContextProps {
  activeStep: number
}

const StepperContext = React.createContext<StepperContextProps>({ activeStep: 0 })

// Context for step index
interface StepContextProps {
  index: number
}

const StepContext = React.createContext<StepContextProps | null>(null)

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
  children: React.ReactNode
}

export function Stepper({ index, children, className, ...props }: StepperProps) {
  return (
    <StepperContext.Provider value={{ activeStep: index }}>
      <div className={cn("flex w-full", className)} {...props}>
        {children}
      </div>
    </StepperContext.Provider>
  )
}

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
  children: React.ReactNode
}

export function Step({ index, children, className, ...props }: StepProps) {
  return (
    <StepContext.Provider value={{ index }}>
      <div className={cn("flex-1 relative", className)} {...props}>
        {children}
      </div>
    </StepContext.Provider>
  )
}

export function StepIndicator({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface StepStatusProps {
  complete: React.ReactNode
  incomplete: React.ReactNode
  active: React.ReactNode
}

export function StepStatus({ complete, incomplete, active }: StepStatusProps) {
  const { activeStep } = React.useContext(StepperContext)
  const step = React.useContext(StepContext)

  if (!step) {
    return null
  }

  if (step.index < activeStep) {
    return <>{complete}</>
  }

  if (step.index === activeStep) {
    return <>{active}</>
  }

  return <>{incomplete}</>
}

// Add CheckIcon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function StepIcon() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <CheckIcon className="h-3 w-3" />
    </div>
  )
}

export function StepNumber() {
  const step = React.useContext(StepContext)
  const { activeStep } = React.useContext(StepperContext)
  
  if (!step) {
    return null
  }

  const isActive = step.index === activeStep

  return (
    <div className={cn(
      "text-xs font-medium",
      isActive ? "text-primary" : "text-muted-foreground"
    )}>
      {step.index + 1}
    </div>
  )
}

export function StepTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm font-medium", className)} {...props} />
}

export function StepDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function StepSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { activeStep } = React.useContext(StepperContext)
  const step = React.useContext(StepContext)

  if (!step) {
    return null
  }

  const isActive = step.index <= activeStep
  
  return (
    <div
      className={cn(
        "absolute left-4 top-0 -ml-px mt-8 h-[calc(100%-16px)] w-[1px]",
        isActive ? "bg-primary" : "bg-muted",
        className
      )}
      {...props}
    />
  )
} 