import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { reportWebVitals } from "@/lib/web-vitals";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OFAuto Platform",
  description: "AI-powered content automation platform",
};

// Report web vitals
if (typeof window !== 'undefined') {
  reportWebVitals();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
