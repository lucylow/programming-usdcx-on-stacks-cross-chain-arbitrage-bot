"use client"

import { HelpCircle, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import Navigation from "@/components/layout/Navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useState } from "react"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "How does the arbitrage bot work?",
      answer:
        "The bot continuously monitors USDCx prices across Ethereum and Stacks networks. When it detects a price difference (spread) that exceeds your configured minimum profit threshold after accounting for gas fees and bridge costs, it automatically executes a trade to capture the arbitrage opportunity.",
    },
    {
      question: "What are the fees for using the bot?",
      answer:
        "The bot charges a small percentage fee on profitable trades. Additionally, you'll pay standard network gas fees for transactions on both Ethereum and Stacks networks, as well as bridge fees when transferring assets between chains.",
    },
    {
      question: "Is my wallet secure?",
      answer:
        "Yes, your wallet remains in your control at all times. The bot only requests transaction signatures for trades you approve. Your private keys never leave your wallet. We recommend using a hardware wallet for additional security.",
    },
    {
      question: "What is the minimum amount needed to start?",
      answer:
        "There's no strict minimum, but we recommend starting with at least $100-500 to cover gas fees and ensure profitable trades. Smaller amounts may not be profitable after accounting for transaction costs.",
    },
    {
      question: "How often does the bot execute trades?",
      answer:
        "Trade frequency depends on market conditions and opportunity availability. The bot only executes when profitable opportunities are detected that meet your configured thresholds. This could be multiple times per day or less frequently during stable market conditions.",
    },
    {
      question: "Can I customize the bot's trading parameters?",
      answer:
        "Yes, you can configure minimum profit thresholds, risk tolerance levels, maximum trade sizes, and gas price preferences. These settings help you balance between opportunity frequency and risk management.",
    },
    {
      question: "What happens if a trade fails?",
      answer:
        "If a trade fails due to network issues, slippage, or other factors, you'll only lose the gas fees for the attempted transaction. The bot includes built-in safety checks to minimize failed trades, and you can review all trade attempts in the history section.",
    },
    {
      question: "Do I need to keep the browser open?",
      answer:
        "No, once the bot is started and your wallet is connected, it runs independently. However, you'll need to keep the application accessible for the bot to function. For 24/7 operation, consider running the backend service on a server.",
    },
    {
      question: "How do I withdraw my profits?",
      answer:
        "Profits accumulate in your connected wallet. You can withdraw funds at any time using your wallet's standard withdrawal functionality. The bot doesn't hold your funds - they remain in your wallet.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "Currently, the platform is web-based and optimized for desktop and mobile browsers. You can access it from any device with a compatible wallet browser extension.",
    },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-darker text-white">
        <Navigation />
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-8 h-8 text-brand" />
              <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
            </div>
            <p className="text-muted-foreground mb-12">
              Find answers to common questions about the arbitrage bot
            </p>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-card-bg border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-dark/50 transition-colors"
                  >
                    <span className="font-semibold text-lg pr-8">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
                  )}
                </Card>
              ))}
            </div>

            {/* Contact Section */}
            <Card className="bg-card-bg border-white/10 p-8 mt-12">
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-muted-foreground mb-4">
                If you can't find the answer you're looking for, feel free to reach out to our support team.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="px-4 py-2 bg-brand hover:bg-brand-dark rounded-lg text-sm font-medium transition-colors"
                >
                  Contact Support
                </a>
                <a
                  href="#"
                  className="px-4 py-2 border border-white/20 hover:bg-dark/50 rounded-lg text-sm font-medium transition-colors"
                >
                  Join Discord
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
