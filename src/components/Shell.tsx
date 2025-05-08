import React from 'react';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 