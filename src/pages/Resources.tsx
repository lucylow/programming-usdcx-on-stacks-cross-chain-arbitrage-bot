import { Card } from "@/components/ui/card"
import { BookOpen, FileText, Code, Video, ExternalLink } from "lucide-react"
import Navigation from "@/components/layout/Navigation"
import { Link } from "react-router-dom"

const resources = [
  {
    title: "Documentation",
    icon: BookOpen,
    description: "Complete technical documentation and guides",
    href: "/docs",
    internal: true,
  },
  {
    title: "API Reference",
    icon: Code,
    description: "REST API endpoints and integration guides",
    href: "/docs/api",
    internal: true,
  },
  {
    title: "Smart Contracts",
    icon: FileText,
    description: "Contract source code and addresses",
    href: "/docs/contracts",
    internal: true,
  },
  {
    title: "Video Tutorials",
    icon: Video,
    description: "Step-by-step video guides",
    href: "#",
    internal: false,
  },
  {
    title: "GitHub Repository",
    icon: ExternalLink,
    description: "View source code and contribute",
    href: "https://github.com",
    internal: false,
  },
  {
    title: "Community Forum",
    icon: ExternalLink,
    description: "Join discussions and get help",
    href: "#",
    internal: false,
  },
]

export default function Resources() {
  return (
    <div className="min-h-screen bg-darker text-white">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-brand" />
            <h1 className="text-4xl font-bold">Resources</h1>
          </div>
          <p className="text-muted-foreground mb-12 max-w-3xl">
            Access documentation, guides, tutorials, and community resources to help you get the most out of the
            arbitrage bot.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => {
              const Content = resource.internal ? (
                <Link to={resource.href}>
                  <Card className="bg-card-bg/50 border-white/10 p-6 hover:border-brand transition-colors h-full">
                    <resource.icon className="w-8 h-8 text-brand mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
                    <p className="text-muted-foreground">{resource.description}</p>
                  </Card>
                </Link>
              ) : (
                <a href={resource.href} target="_blank" rel="noopener noreferrer">
                  <Card className="bg-card-bg/50 border-white/10 p-6 hover:border-brand transition-colors h-full">
                    <resource.icon className="w-8 h-8 text-brand mb-4" />
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      {resource.title}
                      <ExternalLink className="w-4 h-4" />
                    </h3>
                    <p className="text-muted-foreground">{resource.description}</p>
                  </Card>
                </a>
              )

              return <div key={index}>{Content}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

