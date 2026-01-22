import { Card } from "@/components/ui/card"
import { BookOpen, Code, FileText, Zap, Shield, Wallet } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { Link } from "react-router-dom"

const docSections = [
  {
    title: "Getting Started",
    icon: Zap,
    description: "Quick start guide to set up and run your arbitrage bot",
    href: "/docs/getting-started",
  },
  {
    title: "API Reference",
    icon: Code,
    description: "Complete API documentation for developers",
    href: "/docs/api",
  },
  {
    title: "Smart Contracts",
    icon: FileText,
    description: "Contract addresses and interaction guides",
    href: "/docs/contracts",
  },
  {
    title: "Security",
    icon: Shield,
    description: "Security best practices and audit reports",
    href: "/docs/security",
  },
  {
    title: "Wallet Integration",
    icon: Wallet,
    description: "How to connect and use wallets with the bot",
    href: "/docs/wallets",
  },
]

export default function Docs() {
  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-muted-foreground mb-12 max-w-3xl">
            Comprehensive guides and references for using the cross-chain arbitrage bot. Learn how to set up, configure,
            and optimize your trading operations.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docSections.map((section) => (
              <Link key={section.href} to={section.href}>
                <Card className="bg-card-bg/50 border-white/10 p-6 hover:border-brand transition-colors h-full">
                  <section.icon className="w-8 h-8 text-brand mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                  <p className="text-muted-foreground">{section.description}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="bg-card-bg/50 border-white/10 p-6 mt-12">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Link to="/docs/getting-started" className="text-accent hover:underline">
                → Installation Guide
              </Link>
              <Link to="/docs/api" className="text-accent hover:underline">
                → REST API Endpoints
              </Link>
              <Link to="/docs/contracts" className="text-accent hover:underline">
                → Contract Addresses
              </Link>
              <Link to="/docs/security" className="text-accent hover:underline">
                → Security Audit
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


