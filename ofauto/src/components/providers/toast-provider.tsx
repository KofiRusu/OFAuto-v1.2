'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          style: {
            background: '#3B82F6', // blue-500
          },
        },
        error: {
          style: {
            background: '#EF4444', // red-500
          },
        },
      }}
    />
  );
} 