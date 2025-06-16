'use client'

import * as React from 'react'
import { Toaster } from '@/src/components/ui/Toaster'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}