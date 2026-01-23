import { Card, CardContent } from "../components/ui/card"
import { FileText, Filter, Download, Calendar, TrendingUp, TrendingDown, Search, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, BarChart3, Zap } from "lucide-react"
import Navigation from "../components/layout/Navigation"
import { Button } from "../components/ui/button"
import { EmptyState } from "../../components/ui/empty-state"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"

export default function BotHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const trades: any[] = [] // Will be populated from API
  const itemsPerPage = 10

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Export functionality
    console.log("Exporting trades...")
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
                  <FileText className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                    Trading History
                  </h1>
                  <p className="text-muted-foreground mt-1.5">
                    Complete trade history and analytics
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/bot/dashboard">
                  <Button variant="outline" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Link to="/bot/opportunities">
                  <Button variant="outline" className="gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Opportunities</span>
                  </Button>
                </Link>
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
            </div>
            <p className="text-muted-foreground max-w-3xl text-base sm:text-lg leading-relaxed">
              Complete history of all arbitrage trades executed by the bot. Review past performance, analyze patterns,
              and optimize your trading strategy.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search trades by ID, amount, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trades List */}
          {trades.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <EmptyState
                icon={FileText}
                title="No trading history yet"
                description="Your completed trades will appear here once the bot starts executing arbitrage opportunities. Start the bot and connect your wallet to begin trading."
                action={{
                  label: "Go to Dashboard",
                  onClick: () => navigate("/bot/dashboard"),
                }}
                secondaryAction={{
                  label: "View Opportunities",
                  onClick: () => navigate("/bot/opportunities"),
                }}
              />
            </motion.div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4 mb-6">
                {trades.map((trade, index) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="relative p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              className={`p-3 rounded-xl border ${
                                trade.status === 'success' 
                                  ? 'bg-green-500/10 border-green-500/20' 
                                  : 'bg-red-500/10 border-red-500/20'
                              }`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              {trade.status === 'success' ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">Trade #{trade.id}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    trade.status === 'success' 
                                      ? 'border-green-500/30 text-green-500' 
                                      : 'border-red-500/30 text-red-500'
                                  }
                                >
                                  {trade.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(trade.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                            <div className="text-right">
                              <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                                trade.profit >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                ROI: {(trade.roi * 100).toFixed(2)}%
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button variant="ghost" size="sm" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {trades.length > itemsPerPage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between pt-4 border-t border-border/50"
                >
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, trades.length)} of {trades.length} trades
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(trades.length / itemsPerPage) }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === Math.ceil(trades.length / itemsPerPage) ||
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center gap-1">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(trades.length / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(trades.length / itemsPerPage)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
