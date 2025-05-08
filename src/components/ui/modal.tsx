import React, { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
  {
    variants: {
      position: {
        center: "items-center justify-center",
        top: "items-start justify-center pt-10",
        bottom: "items-end justify-center pb-10",
      },
    },
    defaultVariants: {
      position: "center",
    },
  }
)

const backdropVariants = cva(
  "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-100",
  {
    variants: {
      open: {
        true: "opacity-100",
        false: "opacity-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
)

const contentVariants = cva(
  "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full",
  {
    variants: {
      size: {
        default: "max-w-lg",
        sm: "max-w-sm",
        lg: "max-w-xl",
        xl: "max-w-2xl",
        full: "max-w-full",
      },
      open: {
        true: "scale-100 opacity-100",
        false: "scale-95 opacity-0",
      },
    },
    defaultVariants: {
      size: "default",
      open: false,
    },
  }
)

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof modalVariants>, 
  VariantProps<typeof contentVariants> {
  open: boolean
  onClose: () => void
  hideCloseButton?: boolean
}

export function Modal({
  className,
  children,
  position,
  size,
  open,
  onClose,
  hideCloseButton = false,
  ...props
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElement = useRef<Element | null>(null)
  
  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])
  
  // Focus trap
  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus()
      }
      
      const handleTabKey = (e: KeyboardEvent) => {
        if (!modalRef.current || e.key !== "Tab") return
        
        const focusable = Array.from(
          modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
        
        if (focusable.length === 0) return
        
        const firstFocusable = focusable[0] as HTMLElement
        const lastFocusable = focusable[focusable.length - 1] as HTMLElement
        
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
      
      document.addEventListener("keydown", handleTabKey)
      return () => document.removeEventListener("keydown", handleTabKey)
    } else if (previouslyFocusedElement.current) {
      (previouslyFocusedElement.current as HTMLElement).focus?.()
    }
  }, [open])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])
  
  if (!open) return null
  
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className={cn(modalVariants({ position }), className)}
        {...props}
      >
        <div
          className={cn(contentVariants({ size, open }))}
          ref={modalRef}
        >
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
          {children}
        </div>
      </div>
      <div 
        className={cn(backdropVariants({ open }))}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  )
}

export const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mb-4 flex flex-col space-y-1.5", className)}
    {...props}
  />
)

export const ModalTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)

export const ModalDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)

export const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-4 flex justify-end space-x-2", className)}
    {...props}
  />
) 