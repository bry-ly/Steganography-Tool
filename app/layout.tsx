import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://stegnohide.example.com"),
  title: {
    default: "StegnoHide — Hide Secret Messages in Text or Images",
    template: "%s · StegnoHide",
  },
  description: "Client-side steganography tool. Hide AES-256-GCM-encrypted messages inside plain text or PNG images. 100% in the browser, no server.",
  applicationName: "StegnoHide",
  keywords: ["steganography", "stego", "hide message", "zero-width", "LSB", "AES-256-GCM", "client-side"],
  authors: [{ name: "StegnoHide contributors" }],
  creator: "StegnoHide contributors",
  publisher: "StegnoHide",
  robots: { index: true, follow: true },
  icons: {
    icon: "/logo/Logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stegnohide.example.com",
    siteName: "StegnoHide",
    title: "StegnoHide — Hide Secret Messages in Text or Images",
    description: "Client-side steganography tool. AES-256-GCM-encrypted messages hidden in plain text or PNG images. No server.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "StegnoHide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StegnoHide — Hide Secret Messages in Text or Images",
    description: "Client-side steganography tool. AES-256-GCM-encrypted messages hidden in plain text or PNG images. No server.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", geistSans.variable, geistMono.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-mono">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RootProvider
            theme={{
              enabled: false,
            }}
          >
            {children}
            <Toaster />
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
