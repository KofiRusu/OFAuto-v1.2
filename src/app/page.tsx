import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { CheckCircle, TrendingUp, Shield, Zap, Users, BarChart3, ArrowRight, Menu } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="text-xl font-bold">OFAuto</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="#features" className="transition-colors hover:text-foreground/80">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground/80">
                Pricing
              </Link>
              <Link href="#about" className="transition-colors hover:text-foreground/80">
                About
              </Link>
              <Link href="/docs" className="transition-colors hover:text-foreground/80">
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
          <div className="container relative z-10 py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-4" variant="secondary">
                Trusted by 10,000+ Content Creators
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Automate Your Content
                <span className="block text-primary">Grow Your Revenue</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                The all-in-one platform for OnlyFans creators. Automate posting, manage campaigns, 
                track analytics, and scale your business effortlessly.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features designed specifically for content creators
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Smart Automation</CardTitle>
                  <CardDescription>
                    Schedule posts, automate responses, and manage your content calendar effortlessly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Auto-posting to multiple platforms
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      AI-powered message responses
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Smart content scheduling
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Advanced Analytics</CardTitle>
                  <CardDescription>
                    Track performance, understand your audience, and optimize your strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Real-time revenue tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Subscriber analytics
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Content performance metrics
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Fan Management</CardTitle>
                  <CardDescription>
                    Build stronger relationships and maximize subscriber lifetime value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      CRM for subscriber data
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Automated follow-ups
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Personalized campaigns
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Bank-level security to protect your content and earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      End-to-end encryption
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Watermark protection
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      DMCA takedown support
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Growth Tools</CardTitle>
                  <CardDescription>
                    Scale your business with proven growth strategies and tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      A/B testing campaigns
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Referral programs
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Cross-promotion tools
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>
                    Work seamlessly with managers, assistants, and agencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Role-based permissions
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Task management
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Revenue sharing
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-muted/50 py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose the plan that fits your needs. Upgrade or downgrade anytime.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Perfect for new creators</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Up to 1,000 subscribers
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Basic automation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Analytics dashboard
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Email support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <Badge className="mb-2 w-fit">Most Popular</Badge>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>For growing creators</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Up to 10,000 subscribers
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Advanced automation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      AI chatbot
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Priority support
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Team collaboration
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For agencies & top creators</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Unlimited subscribers
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Custom integrations
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      Dedicated account manager
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      SLA guarantee
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                      White-label options
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to 10x Your Content Business?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of creators who are already using OFAuto to automate their workflow 
                and maximize their earnings.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">OFAuto</h3>
              <p className="text-sm text-muted-foreground">
                The all-in-one platform for content creators to automate, analyze, and grow.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-foreground">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/dmca" className="hover:text-foreground">
                    DMCA Policy
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-foreground">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 OFAuto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}