import { Card } from "@/components/ui/card"
import { HelpCircle, ChevronDown } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "How does the arbitrage bot work?",
    answer:
      "The bot continuously monitors USDCx prices across Ethereum and Stacks networks. When it detects a price difference that exceeds gas fees and slippage, it automatically executes trades to capture the arbitrage opportunity.",
  },
  {
    question: "What are the minimum requirements to use the bot?",
    answer:
      "You need a connected wallet with sufficient funds for trading and gas fees. The bot works with Hiro Wallet for Stacks and MetaMask for Ethereum. Minimum recommended balance is $1000 USDCx.",
  },
  {
    question: "How much profit can I expect?",
    answer:
      "Profit varies based on market conditions, gas prices, and opportunity frequency. Historical data shows average returns of 2-5% per successful arbitrage trade, but results are not guaranteed.",
  },
  {
    question: "Is there a risk of losing funds?",
    answer:
      "Yes, like any trading activity, there are risks including smart contract bugs, bridge failures, market volatility, and gas price spikes. Always trade with funds you can afford to lose.",
  },
  {
    question: "How are gas fees handled?",
    answer:
      "Gas fees are automatically deducted from your trading balance. The bot calculates expected gas costs before executing trades and only proceeds if the potential profit exceeds all costs including fees.",
  },
  {
    question: "Can I customize the bot's trading parameters?",
    answer:
      "Yes, through the bot control panel you can adjust minimum profit thresholds, risk limits, maximum trade sizes, and other parameters to match your risk tolerance.",
  },
  {
    question: "What happens if a trade fails?",
    answer:
      "If a trade fails due to slippage, insufficient funds, or other reasons, you will only lose the gas fees paid for the failed transaction attempt. The bot includes multiple safety checks to minimize failures.",
  },
  {
    question: "How do I withdraw my profits?",
    answer:
      "Profits accumulate in your connected wallet. You can withdraw at any time through your wallet interface. The bot does not hold your funds - they remain in your wallet.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground mb-12 max-w-3xl">
            Find answers to common questions about the arbitrage bot, trading, and platform features.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="bg-card-bg/50 border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-dark/50 transition-colors"
                >
                  <span className="font-semibold pr-8">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform",
                      openIndex === index && "rotate-180"
                    )}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
                )}
              </Card>
            ))}
          </div>

          <Card className="bg-card-bg/50 border-white/10 p-6 mt-12">
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground">
              Check out our{" "}
              <a href="/docs" className="text-accent hover:underline">
                documentation
              </a>{" "}
              or reach out to our support team.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}


