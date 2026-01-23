import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Zap, AlertCircle, TrendingUp, Sparkles, Filter, Search, RefreshCw } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { motion } from "framer-motion"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

export default function BotOpportunities() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Zap className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                    Arbitrage Opportunities
                  </h1>
                  <p className="text-muted-foreground mt-1.5">
                    Real-time market analysis across chains
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-base sm:text-lg leading-relaxed">
              Real-time arbitrage opportunities detected across Ethereum and Stacks networks. Click on any opportunity to
              view detailed analysis and execute trades.
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Opportunities</SelectItem>
                <SelectItem value="high-profit">High Profit</SelectItem>
                <SelectItem value="low-risk">Low Risk</SelectItem>
                <SelectItem value="quick">Quick Execution</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Enhanced Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <motion.div 
                    className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <AlertCircle className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg flex flex-wrap items-center gap-2">
                      How Opportunities Work
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Powered
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our AI engine continuously monitors price differences between Ethereum and Stacks DEXs. When a
                      profitable arbitrage opportunity is detected (accounting for gas fees and slippage), it appears here.
                      Each opportunity shows the potential profit, risk level, and execution time estimate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Opportunities Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -2 }}
          >
            <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 min-h-[450px] hover:shadow-xl hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </motion.div>
                    <CardTitle className="text-xl font-semibold">Live Opportunities</CardTitle>
                  </div>
                  <Badge variant="outline" className="border-secondary/30 text-secondary w-fit">
                    <Zap className="w-3 h-3 mr-1.5 animate-pulse" />
                    Scanning...
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <motion.div 
                    className="relative mb-6"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-6 sm:p-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                      <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3">No Opportunities Detected</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-2 max-w-md mx-auto">
                    The bot is actively scanning for arbitrage opportunities across both networks.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground/70 mb-6">
                    Opportunities will appear here automatically when detected
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground/60 bg-muted/30 px-4 py-2 rounded-full">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-secondary"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity
                      }}
                    />
                    <span>Monitoring Ethereum ↔ Stacks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
