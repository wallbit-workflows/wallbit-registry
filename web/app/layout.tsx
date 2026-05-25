import { ClerkProvider } from "@clerk/nextjs";
import { AppToaster } from "@/components/app-toaster";
import { RegistryProfileProvider } from "@/components/registry-profile-provider";
import { RegistryUsernameGate } from "@/components/registry-username-gate";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter-variable",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Wallbit Registry — workflow index for wallbit-cli",
  description:
    "Discover and install public YAML workflows for wallbit-cli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-y-auto">
        <ClerkProvider appearance={clerkAppearance}>
          <RegistryProfileProvider>
            <RegistryUsernameGate />
            {children}
            <AppToaster />
          </RegistryProfileProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
