import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Zap, Users, Lock, Cpu, Globe, Bitcoin, Eye, EyeOff, 
  ArrowRight, ChevronDown, CheckCircle, TrendingUp, Activity,
  FileText, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PrivacyScoreGauge } from "./zephyr/PrivacyScoreGauge";
import { TransactionPreview } from "./zephyr/TransactionPreview";
import { AnonymitySetViz } from "./zephyr/AnonymitySetViz";

const features = [
  {
    icon: Shield,
    title: "Quantum-Resistant",
    description: "ZK-STARK proofs secure against quantum computers",
    details: "Unlike ZK-SNARKs, STARKs require no trusted setup and are post-quantum secure.",
    stats: "99.9% security",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second proof verification",
    details: "Leverage Starknet scalability for instant private transactions.",
    stats: "<1s verification",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Large Anonymity Sets",
    description: "10,000+ users in mixing pool",
    details: "More users = stronger privacy guarantees.",
    stats: "10k+ users",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "You always control your funds",
    details: "Smart contracts never hold your private keys.",
    stats: "Zero custody risk",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Cpu,
    title: "Gas Optimized",
    description: "Lowest fees on Starknet",
    details: "Batch verification and optimized Cairo contracts.",
    stats: "~$0.50 per mix",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Cross-Chain Ready",
    description: "Multi-chain Bitcoin privacy",
    details: "Future support for Ethereum, Polygon, and more.",
    stats: "3+ chains",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const privacyLevels = [
  { level: "Standard", delay: "24h", users: "~1,000", fee: "0.15%", description: "Good privacy for most users" },
  { level: "High", delay: "72h", users: "~10,000", fee: "0.20%", description: "Strong privacy guarantees" },
  { level: "Maximum", delay: "168h", users: "~100,000", fee: "0.25%", description: "Maximum anonymity" },
];

const tabs = [
  { id: "deposit", label: "Deposit", icon: ArrowDownLeft },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpRight },
  { id: "dashboard", label: "Dashboard", icon: Activity },
];

export function ZephyrSection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState(1);
  const [showSecret, setShowSecret] = useState(false);
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <section id="zephyr" className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-radial from-secondary/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Project Zephyr</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-bold">NEW</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ZK-Private Bitcoin Mixer
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse-slow">
              On Starknet
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Mix your Bitcoin with zero-knowledge STARK proofs. Non-custodial, trust-minimized, quantum-safe.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { value: "10,000+", label: "Active Users", icon: Users, trend: "+12.5%" },
            { value: "$50M+", label: "Total Mixed", icon: Bitcoin, trend: "+8.2%" },
            { value: "<$0.50", label: "Average Fee", icon: Zap, trend: "-15%" },
            { value: "99.9%", label: "Success Rate", icon: Shield, trend: "+0.1%" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card p-6 text-center group hover:border-primary/50 transition-all relative overflow-hidden"
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform relative z-10" />
              <div className="text-2xl md:text-3xl font-bold text-secondary mb-1 relative z-10">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-2 relative z-10">{stat.label}</div>
              <div className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-secondary' : 'text-primary'} relative z-10`}>
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {stat.trend} this week
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
              className="glass-card p-6 group hover:border-primary/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-3">{feature.description}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm text-primary mb-3">
                <CheckCircle className="w-3 h-3" />
                {feature.stats}
              </div>
              
              <AnimatePresence>
                {activeFeature === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-border pt-3 mt-3"
                  >
                    <p className="text-sm text-muted-foreground">{feature.details}</p>
                    <div className="flex items-center mt-3 text-secondary text-sm font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Production Ready
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-0 max-w-6xl mx-auto overflow-hidden"
        >
          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Privacy Mixer Demo</h3>
                <p className="text-sm text-muted-foreground">Experience ZK-private mixing</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-background border border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Panel */}
            <div className="p-8 border-r border-border">
              <AnimatePresence mode="wait">
                {activeTab === "deposit" && (
                  <motion.div
                    key="deposit"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium mb-3">Select Privacy Level</label>
                    <div className="space-y-3">
                      {privacyLevels.map((level, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setSelectedPrivacy(i)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                            selectedPrivacy === i
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {selectedPrivacy === i && (
                            <motion.div
                              layoutId="privacy-indicator"
                              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
                            />
                          )}
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Shield className={`w-5 h-5 ${selectedPrivacy === i ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-bold">{level.level} Privacy</span>
                              </div>
                              {selectedPrivacy === i && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-1">
                              {level.delay} delay · {level.users} users · {level.fee} fee
                            </div>
                            <div className="text-xs text-muted-foreground">{level.description}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Commitment Display */}
                    <div className="mt-6 space-y-4">
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Secret Hash</span>
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="text-primary hover:text-primary/80 p-1 rounded transition-colors"
                          >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="font-mono text-xs break-all p-2 rounded bg-muted/30">
                          {showSecret
                            ? "0x7a3f8c4b2e1d9f6a5c8b7e4d3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3"
                            : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "withdraw" && (
                  <motion.div
                    key="withdraw"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium mb-3">Enter Withdrawal Details</label>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Secret</label>
                        <input 
                          type="password"
                          placeholder="Enter your secret..."
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Nullifier</label>
                        <input 
                          type="password"
                          placeholder="Enter your nullifier..."
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Recipient Address</label>
                        <input 
                          type="text"
                          placeholder="0x..."
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:outline-none font-mono text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Recent Transactions</h4>
                      <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <TransactionPreview />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Panel - Privacy Score & Anonymity */}
            <div className="p-8 bg-gradient-to-br from-background to-primary/5">
              <div className="text-center mb-8">
                <PrivacyScoreGauge score={98.5} size="md" />
              </div>

              <AnonymitySetViz totalUsers={10247} />

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 py-6 text-lg">
                  <Lock className="w-5 h-5 mr-2" />
                  {activeTab === "withdraw" ? "Generate ZK Proof" : "Start Private Mix"}
                </Button>
                <Button variant="outline" className="flex-1 py-6 text-lg">
                  <FileText className="w-5 h-5 mr-2" />
                  View Docs
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
