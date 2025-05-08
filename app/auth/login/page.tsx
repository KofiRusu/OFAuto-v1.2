"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { LoginSchema, RequestOTPSchema, VerifyOTPSchema } from "@/lib/schemas/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithOTP, requestOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<string>("email");
  const [emailForOTP, setEmailForOTP] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string>("");
  
  // Reset password success message from URL
  const resetSuccess = searchParams.get("reset") === "success";

  const passwordForm = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const otpRequestForm = useForm<z.infer<typeof RequestOTPSchema>>({
    resolver: zodResolver(RequestOTPSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpVerifyForm = useForm<z.infer<typeof VerifyOTPSchema>>({
    resolver: zodResolver(VerifyOTPSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const onPasswordSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, values.rememberMe);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPRequestSubmit = async (values: z.infer<typeof RequestOTPSchema>) => {
    setIsLoading(true);
    try {
      await requestOTP(values.email);
      setEmailForOTP(values.email);
      setOtpSent(true);
      toast.success("OTP sent to your email");
      
      // Pre-fill the email field in the verify form
      otpVerifyForm.setValue("email", values.email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPVerifySubmit = async (values: z.infer<typeof VerifyOTPSchema>) => {
    setIsLoading(true);
    try {
      await loginWithOTP(values.email, values.code);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {resetSuccess && (
          <Alert variant="default" className="bg-green-50 text-green-900 border-green-200">
            <AlertDescription>
              Your password has been reset successfully. Please log in with your new password.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email & Password</TabsTrigger>
            <TabsTrigger value="otp">One-Time Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Remember me</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/forgot-password" className="hover:text-primary">
                Forgot your password?
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="otp" className="space-y-4">
            {!otpSent ? (
              <Form {...otpRequestForm}>
                <form onSubmit={otpRequestForm.handleSubmit(onOTPRequestSubmit)} className="space-y-4">
                  <FormField
                    control={otpRequestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send One-Time Code"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...otpVerifyForm}>
                <form onSubmit={otpVerifyForm.handleSubmit(onOTPVerifySubmit)} className="space-y-4">
                  <FormField
                    control={otpVerifyForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            disabled={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={otpVerifyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One-Time Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit code"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setOtpSent(false);
                        setEmailForOTP("");
                      }}
                      disabled={isLoading}
                    >
                      Use different email
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="hover:text-primary">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
} 