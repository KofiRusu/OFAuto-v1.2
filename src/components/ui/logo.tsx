'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = false }: LogoProps) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className={cn(
        "flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground font-bold",
        className
      )}>
        OF
      </div>
      {showText && (
        <span className="text-xl font-semibold">OFAuto</span>
      )}
    </Link>
  );
} 