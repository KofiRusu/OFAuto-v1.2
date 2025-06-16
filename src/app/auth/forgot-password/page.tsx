import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Logo } from '@/src/components/ui/logo'

export const metadata: Metadata = {
  title: 'Forgot Password - OFAuto',
  description: 'Reset your OFAuto account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Logo className="h-12 w-auto" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <Card>
          <form className="space-y-6">
            <CardHeader>
              <CardTitle>Password Recovery</CardTitle>
              <CardDescription>
                We&apos;ll send a password reset link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Remember your password? </span>
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}