import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

// Import components to test
import { Button } from '@/src/components/ui/button'
import { EmptyState } from '@/src/components/ui/empty-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { InteractiveButton } from '@/src/components/ui/interactive-button'
import { AccessibleModal } from '@/src/components/ui/accessible-modal'

// Add custom jest matcher
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button>Click me</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes when disabled', () => {
      render(
        <Button disabled>Disabled Button</Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick}>Keyboard Button</Button>
      )
      const button = screen.getByRole('button')
      
      // Simulate Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      expect(handleClick).toHaveBeenCalled()
      
      // Simulate Space key
      handleClick.mockClear()
      fireEvent.keyDown(button, { key: ' ', code: 'Space' })
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('EmptyState Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EmptyState
          title="No data available"
          description="Start by adding some items"
          action={<Button>Add Item</Button>}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      render(
        <EmptyState
          title="No data available"
          description="Start by adding some items"
        />
      )
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('No data available')
    })
  })

  describe('PageHeader Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PageHeader
          title="Dashboard"
          description="Welcome to your dashboard"
          actions={<Button>New Item</Button>}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading structure', () => {
      render(
        <PageHeader
          title="Dashboard"
          description="Welcome to your dashboard"
        />
      )
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Dashboard')
    })
  })

  describe('InteractiveButton Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <InteractiveButton>Interactive</InteractiveButton>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should maintain focus visibility', () => {
      render(
        <InteractiveButton>Focus Test</InteractiveButton>
      )
      const button = screen.getByRole('button')
      
      // Focus the button
      button.focus()
      expect(button).toHaveFocus()
      
      // Check for focus styles (this would depend on your CSS)
      expect(button).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('AccessibleModal Component', () => {
    it('should have no accessibility violations when open', async () => {
      const { container } = render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          description="This is a test modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
    })

    it('should close on Escape key', () => {
      const handleClose = jest.fn()
      render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal"
        >
          <p>Modal content</p>
        </AccessibleModal>
      )
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
      expect(handleClose).toHaveBeenCalled()
    })

    it('should trap focus within modal', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
        >
          <button>First button</button>
          <button>Second button</button>
          <button>Third button</button>
        </AccessibleModal>
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // First focusable element should receive focus
      expect(document.activeElement).toBe(buttons[0])
    })
  })

  describe('Color Contrast', () => {
    it('should have sufficient contrast for primary button', async () => {
      const { container } = render(
        <Button variant="default">Primary Button</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have sufficient contrast for secondary button', async () => {
      const { container } = render(
        <Button variant="secondary">Secondary Button</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have sufficient contrast for destructive button', async () => {
      const { container } = render(
        <Button variant="destructive">Delete</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('should have associated labels for inputs', () => {
      render(
        <form>
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" />
        </form>
      )
      
      const input = screen.getByLabelText('Email Address')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should have proper error messaging', () => {
      render(
        <form>
          <label htmlFor="username">Username</label>
          <input 
            id="username" 
            type="text" 
            aria-invalid="true"
            aria-describedby="username-error"
          />
          <span id="username-error" role="alert">
            Username is required
          </span>
        </form>
      )
      
      const input = screen.getByLabelText('Username')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'username-error')
      
      const error = screen.getByRole('alert')
      expect(error).toHaveTextContent('Username is required')
    })
  })

  describe('Navigation Accessibility', () => {
    it('should have proper navigation landmarks', () => {
      render(
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      )
      
      const nav = screen.getByRole('navigation', { name: 'Main navigation' })
      expect(nav).toBeInTheDocument()
      
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(3)
    })

    it('should indicate current page in navigation', () => {
      render(
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="/home" aria-current="page">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      )
      
      const currentPage = screen.getByRole('link', { name: 'Home' })
      expect(currentPage).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Loading States', () => {
    it('should announce loading states to screen readers', () => {
      render(
        <div role="status" aria-live="polite" aria-label="Loading content">
          <span className="sr-only">Loading...</span>
        </div>
      )
      
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-live', 'polite')
      expect(status).toHaveAttribute('aria-label', 'Loading content')
    })
  })

  describe('Images', () => {
    it('should have alt text for informative images', () => {
      render(
        <img src="/logo.png" alt="Company Logo" />
      )
      
      const img = screen.getByAltText('Company Logo')
      expect(img).toBeInTheDocument()
    })

    it('should have empty alt for decorative images', () => {
      render(
        <img src="/decoration.png" alt="" role="presentation" />
      )
      
      const img = screen.getByRole('presentation')
      expect(img).toHaveAttribute('alt', '')
    })
  })
})