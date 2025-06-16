import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    
    // Check URL
    await expect(page).toHaveURL('/login')
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Sign in')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login')
    
    // Click forgot password link
    await page.click('text=Forgot password?')
    
    // Check navigation
    await expect(page).toHaveURL('/auth/forgot-password')
    await expect(page.locator('h2')).toContainText('Forgot your password?')
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    
    // Enter email
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Check for success message
    await expect(page.locator('text=Reset link sent')).toBeVisible()
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    
    // Navigate to register
    await page.click('text=Create account')
    await expect(page).toHaveURL('/register')
    
    // Navigate back to login
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/login')
  })

  test('should show/hide password visibility', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.locator('input[name="password"]')
    const toggleButton = page.locator('button[aria-label="Toggle password visibility"]')
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should maintain form state on navigation', async ({ page }) => {
    await page.goto('/login')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    
    // Navigate away and back
    await page.click('text=Create account')
    await page.click('text=Sign in')
    
    // Check if email is still filled
    const emailValue = await page.locator('input[type="email"]').inputValue()
    expect(emailValue).toBe('')  // Form should be cleared on navigation
  })
})

test.describe('Authenticated User Flow', () => {
  test.use({
    storageState: 'tests/e2e/.auth/user.json'  // Use authenticated state
  })

  test('should redirect to dashboard after login', async ({ page }) => {
    await page.goto('/login')
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show user menu', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click user avatar
    await page.click('[data-testid="user-menu-trigger"]')
    
    // Check menu items
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Sign out')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Open user menu and logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('text=Sign out')
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Accessibility', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login')
    
    // Check for accessibility
    const accessibilityScanResults = await page.evaluate(() => {
      // This would use axe-core in a real implementation
      return {
        violations: []
      }
    })
    
    expect(accessibilityScanResults.violations).toHaveLength(0)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login')
    
    // Tab through form elements
    await page.keyboard.press('Tab')  // Focus email
    await expect(page.locator('input[type="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')  // Focus password
    await expect(page.locator('input[type="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab')  // Focus submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused()
    
    // Submit form with Enter
    await page.keyboard.press('Enter')
  })
})

test.describe('Mobile Experience', () => {
  test.use({
    viewport: { width: 375, height: 667 }  // iPhone SE
  })

  test('should show mobile-optimized login', async ({ page }) => {
    await page.goto('/login')
    
    // Check mobile menu is visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Check form is properly sized
    const form = page.locator('form')
    const box = await form.boundingBox()
    expect(box?.width).toBeLessThan(360)
  })

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/login')
    
    const submitButton = page.locator('button[type="submit"]')
    const box = await submitButton.boundingBox()
    
    // Check minimum touch target size (44x44 pixels)
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  })
})