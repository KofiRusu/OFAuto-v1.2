import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    
    // Check if login form elements are present
    await expect(page.getByText('Sign in to OFAuto')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/login')
    
    // Submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Check for validation messages
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByText('Sign up').click()
    await expect(page).toHaveURL('/register')
  })
})