"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/ui/icons";
import { RegisterEmailSchema, RegisterOTPSchema, VerifyOTPSchema } from "@/lib/schemas/auth";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { signup, signupWithOTP, verifyRegistrationOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<string>("email");
  const [emailForOTP, setEmailForOTP] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);

  const passwordForm = useForm<z.infer<typeof RegisterEmailSchema>>({
    resolver: zodResolver(RegisterEmailSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const otpRequestForm = useForm<z.infer<typeof RegisterOTPSchema>>({
    resolver: zodResolver(RegisterOTPSchema),
    defaultValues: {
      name: "",
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

  const onPasswordSubmit = async (values: z.infer<typeof RegisterEmailSchema>) => {
    setIsLoading(true);
    try {
      await signup(values.name, values.email, values.password, values.passwordConfirm);
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPRequestSubmit = async (values: z.infer<typeof RegisterOTPSchema>) => {
    setIsLoading(true);
    try {
      await signupWithOTP(values.name, values.email);
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
      await verifyRegistrationOTP(values.email, values.code);
      toast.success("Account created successfully");
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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up for OFAuto to get started
          </p>
        </div>

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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          type="email"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
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
                          autoComplete="new-password"
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
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="new-password"
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
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="otp" className="space-y-4">
            {!otpSent ? (
              <Form {...otpRequestForm}>
                <form onSubmit={otpRequestForm.handleSubmit(onOTPRequestSubmit)} className="space-y-4">
                  <FormField
                    control={otpRequestForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Name"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
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
                      "Create Account"
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
          Already have an account?{" "}
          <Link href="/auth/login" className="hover:text-primary">
            Sign in
          </Link>
        </div>
        
        <p className="px-8 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
} 