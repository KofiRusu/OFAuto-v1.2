'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Info, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function OnlyFansLoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const accountId = searchParams.get('accountId')
  
  const [status, setStatus] = useState<'idle' | 'launching' | 'waiting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  
  const handleStartLogin = async () => {
    try {
      setStatus('launching')
      setInfoMessage('Preparing to launch browser for OnlyFans login...')
      
      // Call backend endpoint to initiate the process
      const response = await fetch('/api/onlyfans/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate login process')
      }
      
      setStatus('waiting')
      setInfoMessage('Browser has been launched. Please log in to your OnlyFans account in the browser window, then return to this page.')
      
      // Start polling for session status
      startPollingSessionStatus()
    } catch (error) {
      console.error('Error starting login process:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }
  
  const startPollingSessionStatus = () => {
    // Poll every 5 seconds to check if session is valid
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/onlyfans/session?accountId=${accountId || ''}`)
        const data = await response.json()
        
        if (data.isValid) {
          clearInterval(intervalId)
          setStatus('success')
          setInfoMessage('Login successful! Your session has been saved.')
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/dashboard/automation/onlyfans')
          }, 3000)
        }
      } catch (error) {
        console.error('Error checking session status:', error)
      }
    }, 5000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Link href="/dashboard/automation/onlyfans" className="flex items-center text-sm mb-4 hover:underline">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to OnlyFans Automation
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>OnlyFans Login</CardTitle>
          <CardDescription>
            Use this page to log in to your OnlyFans account and save your session for automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Information alerts */}
          {status === 'idle' && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Login Required</AlertTitle>
              <AlertDescription>
                To automate actions on your OnlyFans account, you need to log in manually due to site security measures.
                This process is secure and your credentials are never stored - only a browser session is saved.
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'launching' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Preparing Login</AlertTitle>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
          
          {status === 'waiting' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Browser Launched</AlertTitle>
              <AlertDescription>
                {infoMessage}
                <div className="mt-2 flex items-center space-x-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs font-medium">Waiting for successful login...</span>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && (
            <Alert variant="default" className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-600 dark:text-green-400">Login Successful</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                {infoMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Instructions */}
          {['idle', 'error'].includes(status) && (
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">How it works:</h3>
              <ol className="space-y-2 list-decimal list-inside text-sm">
                <li>Click the "Start Login Process" button below</li>
                <li>A new browser window will open to OnlyFans</li>
                <li>Log in manually with your OnlyFans credentials</li>
                <li>Once logged in, the session will be automatically saved</li>
                <li>You'll be redirected back to the automation dashboard</li>
              </ol>
              <div className="text-sm text-muted-foreground mt-2">
                Note: Your login credentials are never stored, only the browser session cookies.
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/automation/onlyfans">Cancel</Link>
          </Button>
          
          {['idle', 'error'].includes(status) && (
            <Button onClick={handleStartLogin}>
              {status === 'error' ? 'Try Again' : 'Start Login Process'}
            </Button>
          )}
          
          {status === 'waiting' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Waiting for login...
            </Button>
          )}
          
          {status === 'success' && (
            <Button asChild>
              <Link href="/dashboard/automation/onlyfans">Return to Dashboard</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 