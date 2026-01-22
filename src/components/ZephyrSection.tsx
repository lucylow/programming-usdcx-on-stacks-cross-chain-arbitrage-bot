import { motion } from "framer-motion";
import { Shield, Zap, Users, Lock, Cpu, Globe, Bitcoin, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Quantum-Resistant",
    description: "ZK-STARK proofs secure against quantum computers",
    details: "Unlike ZK-SNARKs, STARKs require no trusted setup and are post-quantum secure.",
    stats: "99.9% security",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second proof verification",
    details: "Leverage Starknet scalability for instant private transactions.",
    stats: "<1s verification",
  },
  {
    icon: Users,
    title: "Large Anonymity Sets",
    description: "10,000+ users in mixing pool",
    details: "More users = stronger privacy guarantees.",
    stats: "10k+ users",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "You always control your funds",
    details: "Smart contracts never hold your private keys.",
    stats: "Zero custody risk",
  },
  {
    icon: Cpu,
    title: "Gas Optimized",
    description: "Lowest fees on Starknet",
    details: "Batch verification and optimized Cairo contracts.",
    stats: "~$0.50 per mix",
  },
  {
    icon: Globe,
    title: "Cross-Chain Ready",
    description: "Multi-chain Bitcoin privacy",
    details: "Future support for Ethereum, Polygon, and more.",
    stats: "3+ chains",
  },
];

const privacyLevels = [
  { level: "Standard", delay: "24h", users: "~1,000", fee: "0.15%" },
  { level: "High", delay: "72h", users: "~10,000", fee: "0.20%" },
  { level: "Maximum", delay: "168h", users: "~100,000", fee: "0.25%" },
];

export function ZephyrSection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState(1);
  const [showSecret, setShowSecret] = useState(false);

  return (
    <section id="zephyr" className="py-24 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Project Zephyr</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ZK-Private Bitcoin Mixer
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
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
            { value: "10,000+", label: "Active Users", icon: Users },
            { value: "$50M+", label: "Total Mixed", icon: Bitcoin },
            { value: "<$0.50", label: "Average Fee", icon: Zap },
            { value: "99.9%", label: "Success Rate", icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 text-center group hover:border-primary/50 transition-all">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl md:text-3xl font-bold text-secondary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
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
              className="glass-card p-6 group hover:border-primary/50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-3">{feature.description}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-sm text-primary mb-3">
                {feature.stats}
              </div>
              
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: activeFeature === index ? "auto" : 0,
                  opacity: activeFeature === index ? 1 : 0
                }}
                className="overflow-hidden border-t border-border pt-3 mt-3"
              >
                <p className="text-sm text-muted-foreground">{feature.details}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Privacy Mixer Demo</h3>
              <p className="text-muted-foreground">Experience ZK-private mixing</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Privacy Level Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Privacy Level</label>
              <div className="space-y-3">
                {privacyLevels.map((level, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPrivacy(i)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPrivacy === i
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{level.level} Privacy</span>
                      {selectedPrivacy === i && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {level.delay} delay · {level.users} users · {level.fee} fee
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Commitment Display */}
            <div>
              <label className="block text-sm font-medium mb-3">Your Secure Commitment</label>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Secret Hash</span>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-primary hover:text-primary/80"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="font-mono text-sm break-all">
                    {showSecret
                      ? "0x7a3f8c4b2e1d9f6a5c8b7e4d3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3"
                      : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <div className="text-sm text-muted-foreground mb-2">Nullifier</div>
                  <div className="font-mono text-sm break-all">
                    {showSecret
                      ? "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
                      : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Anonymity Set</span>
                  </div>
                  <div className="text-2xl font-bold">{privacyLevels[selectedPrivacy].users}</div>
                  <div className="text-sm text-muted-foreground">
                    Users in your mixing pool
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 px-8 py-6 text-lg">
              <Lock className="w-5 h-5 mr-2" />
              Start Private Mix
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg">
              <ArrowRight className="w-5 h-5 mr-2" />
              View Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
