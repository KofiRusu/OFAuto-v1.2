import * as React from 'react'
import { cn } from '@/src/lib/utils'
import { Button, ButtonProps } from '@/src/components/ui/button'

export interface InteractiveButtonProps extends ButtonProps {
  showRipple?: boolean
  hoverScale?: boolean
  glowOnHover?: boolean
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ className, showRipple = true, hoverScale = true, glowOnHover = false, children, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; size: number }>>([])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (showRipple) {
        const rect = event.currentTarget.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = event.clientX - rect.left - size / 2
        const y = event.clientY - rect.top - size / 2

        const newRipple = { x, y, size }
        setRipples([...ripples, newRipple])

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.slice(1))
        }, 600)
      }

      // Call original onClick if provided
      if (props.onClick) {
        props.onClick(event)
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          hoverScale && 'hover:scale-105 active:scale-95',
          glowOnHover && 'hover:shadow-lg hover:shadow-primary/25',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {showRipple && ripples.map((ripple, index) => (
          <span
            key={index}
            className="absolute animate-ripple rounded-full bg-white/30"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              animation: 'ripple 600ms ease-out',
            }}
          />
        ))}
        
        {/* Button content */}
        <span className="relative z-10">{children}</span>
      </Button>
    )
  }
)
InteractiveButton.displayName = 'InteractiveButton'

export { InteractiveButton }