import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { StacksProvider } from "@/lib/stacks/StacksProvider"
import { DappProvider } from "@/lib/dapp/DappProvider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cross-Chain Arbitrage Bot | USDCx on Stacks Hackathon",
  description:
    "AI-powered cross-chain arbitrage bot that automatically discovers and executes profitable opportunities across Ethereum and Stacks",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <StacksProvider network="testnet">
          <DappProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "bg-dark border-white/10 text-white",
              }}
            />
          </DappProvider>
        </StacksProvider>
        <Analytics />
      </body>
    </html>
  )
}
