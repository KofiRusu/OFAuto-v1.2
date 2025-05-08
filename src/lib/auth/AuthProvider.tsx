"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
import { jwtDecode } from 'jwt-decode';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  requestOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string, passwordConfirm: string) => Promise<void>;
  signupWithOTP: (name: string, email: string) => Promise<void>;
  verifyRegistrationOTP: (email: string, otp: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirm: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const utils = trpc.useUtils();

  // On mount, check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Decode token to check expiration
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          // Try to refresh the token
          await refreshAccessToken(refreshToken);
        } else {
          // Token is valid, fetch user data
          setUser({
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            name: '' // Will be populated with the me query
          });
          setIsAuthenticated(true);
          
          // Fetch complete user data
          await utils.auth.me.fetch();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [utils.auth.me]);

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const result = await utils.auth.refresh.mutate({ refreshToken });
      localStorage.setItem('accessToken', result.accessToken);
      
      // Decode the new token
      const decoded = jwtDecode<DecodedToken>(result.accessToken);
      setUser({
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: '' // Will be populated with the me query
      });
      setIsAuthenticated(true);
      
      // Fetch complete user data
      await utils.auth.me.fetch();
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      
      return false;
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await utils.auth.login.mutate({ email, password, rememberMe });
      
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const result = await utils.auth.verifyLoginOTP.mutate({ email, code: otp });
      
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred during OTP verification');
    } finally {
      setIsLoading(false);
    }
  };

  const requestOTP = async (email: string) => {
    try {
      await utils.auth.requestLoginOTP.mutate({ email });
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred requesting OTP');
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await utils.auth.logout.mutate();
      }
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, passwordConfirm: string) => {
    setIsLoading(true);
    try {
      const result = await utils.auth.register.mutate({ 
        name, 
        email, 
        password, 
        passwordConfirm 
      });
      
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOTP = async (name: string, email: string) => {
    try {
      await utils.auth.requestRegistrationOTP.mutate({ name, email });
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred requesting registration OTP');
    }
  };

  const verifyRegistrationOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const result = await utils.auth.verifyRegistrationOTP.mutate({ email, code: otp });
      
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      // If password reset is required, redirect to set password page
      if (result.passwordResetRequired) {
        router.push('/auth/set-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred during OTP verification');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await utils.auth.requestPasswordReset.mutate({ email });
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred requesting password reset');
    }
  };

  const resetPassword = async (token: string, password: string, passwordConfirm: string) => {
    try {
      await utils.auth.resetPassword.mutate({ token, password, passwordConfirm });
      router.push('/auth/login?reset=success');
    } catch (error) {
      if (error instanceof TRPCClientError) {
        throw new Error(error.message);
      }
      throw new Error('An error occurred resetting password');
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithOTP,
    requestOTP,
    logout,
    signup,
    signupWithOTP,
    verifyRegistrationOTP,
    requestPasswordReset,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 