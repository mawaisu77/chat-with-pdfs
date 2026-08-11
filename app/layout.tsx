import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Chat — Intelligence for Your Documents",
  description: "Upload PDFs, ask questions, get cited answers powered by AI.",
  icons: { icon: [] },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#38bdf8",
    colorBackground: "#0a0f1e",
    colorText: "#f1f5f9",
    colorTextSecondary: "#94a3b8",
    colorInputBackground: "#0f172a",
    colorInputText: "#f1f5f9",
    borderRadius: "0.75rem",
  },
  elements: {
    card: {
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      border: "1px solid rgba(148, 163, 184, 0.15)",
      backgroundColor: "#0a0f1e",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #2563eb, #38bdf8)",
      boxShadow: "0 0 20px rgba(56, 189, 248, 0.3)",
      "&:hover": { filter: "brightness(1.08)" },
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ClerkProvider
          signInUrl="/auth/login"
          signUpUrl="/auth/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          appearance={clerkAppearance}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
