'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // OTP (one-time password) state
  const [otpMode, setOtpMode] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [verificationId, setVerificationId] = useState('')
  
  // Handle sign in with password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    try {
      setIsLoading(true)
      setError('')
      
      const result = await signIn.create({
        identifier: email,
        password,
      })
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        console.error('Unexpected result from sign in:', result)
        setError('An unexpected error occurred. Please try again.')
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      setError(err.errors?.[0]?.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Start email OTP flow
  const handleEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    try {
      setIsLoading(true)
      setError('')
      
      // Start the email OTP verification process
      const { supportedFirstFactors } = await signIn.create({
        identifier: email
      })
      
      // Find email OTP strategy
      const emailStrategy = supportedFirstFactors.find(factor => 
        factor.strategy === 'email_code'
      ) as { emailAddressId: string } | undefined
      
      if (!emailStrategy) {
        throw new Error('Email OTP not supported for this account')
      }
      
      // Prepare OTP verification
      const { emailAddressId } = emailStrategy
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId
      })
      
      // Switch to OTP entry mode
      setOtpMode(true)
      setVerificationId(emailAddressId)
      
    } catch (err: any) {
      console.error('Email OTP error:', err)
      setError(err.errors?.[0]?.message || 'Failed to send verification code.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Verify OTP code
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    try {
      setIsLoading(true)
      setError('')
      
      // Attempt to verify the code
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otpCode,
        emailAddressId: verificationId,
      })
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        console.error('Unexpected result after OTP verification:', result)
        setError('An unexpected error occurred. Please try again.')
      }
    } catch (err: any) {
      console.error('OTP verification error:', err)
      setError(err.errors?.[0]?.message || 'Invalid verification code.')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">OFAuto</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        
        <Card>
          {!otpMode ? (
            // Email + Password or Email OTP flow
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="otp">Email OTP</TabsTrigger>
              </TabsList>
              
              <TabsContent value="password">
                <form onSubmit={handlePasswordSignIn}>
                  <CardHeader>
                    <CardTitle>Password Login</CardTitle>
                    <CardDescription>
                      Sign in with your email and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link 
                          href="/forgot-password" 
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : 'Sign In'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      <Link href="/register" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="otp">
                <form onSubmit={handleEmailOTP}>
                  <CardHeader>
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>
                      We'll send a code to your email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-otp">Email</Label>
                      <Input 
                        id="email-otp" 
                        type="email" 
                        placeholder="name@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : 'Send Verification Code'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      <Link href="/register" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            // OTP verification form
            <form onSubmit={handleVerifyOTP}>
              <CardHeader>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We've sent a verification code to {email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Verification Code</Label>
                  <Input 
                    id="otp-code" 
                    type="text" 
                    placeholder="123456" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : 'Verify Code'}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-xs"
                  onClick={() => setOtpMode(false)}
                >
                  Try a different method
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
} 