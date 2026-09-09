import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { SplashProvider } from "@/components/ui/splash-provider";
import { PageTransition } from "@/components/ui/page-transition";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocLens — Intelligent Document Analysis",
  description:
    "Tell us about yourself once. We'll match you to every central and state welfare scheme you're eligible for — no bureaucracy, no missed deadlines.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-screen bg-warm-paper font-body text-ink-navy antialiased">
        <SplashProvider>
          <AuthProvider>
            <PageTransition>{children}</PageTransition>
            <CustomCursor />
          </AuthProvider>
        </SplashProvider>
      </body>
    </html>
  );
}
