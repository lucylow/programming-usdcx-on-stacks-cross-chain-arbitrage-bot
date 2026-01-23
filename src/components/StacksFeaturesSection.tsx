import { motion } from "framer-motion";
import { 
  Wallet, 
  Network, 
  Coins, 
  TrendingUp, 
  Shield, 
  Zap, 
  Layers,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useStacks } from "@lib/stacks/StacksProvider";
import { Card } from "@/components/ui/card";

const stacksFeatures = [
  {
    icon: Wallet,
    title: "Wallet Integration",
    description: "Seamlessly connect with Hiro Wallet to manage your USDCx and STX balances. View real-time balances and transaction history.",
    link: "/bot/dashboard",
    linkText: "Connect Wallet",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Network,
    title: "Network Switching",
    description: "Easily switch between Stacks testnet and mainnet. All balances and transactions update automatically based on your selected network.",
    link: "/bot/dashboard",
    linkText: "Switch Network",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Coins,
    title: "USDCx Token Operations",
    description: "Transfer, approve, and manage USDCx tokens directly from the interface. Batch transfers supported for efficient operations.",
    link: "/bot/dashboard",
    linkText: "Manage Tokens",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "DeFi Integration",
    description: "Stake USDCx for rewards, supply to lending pools, or borrow against collateral. All DeFi operations in one place.",
    link: "/defi",
    linkText: "Explore DeFi",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Shield,
    title: "Transaction Security",
    description: "All transactions are signed securely through your wallet. Monitor transaction status in real-time with automatic updates.",
    link: "/bot/history",
    linkText: "View Transactions",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Layers,
    title: "Smart Contract Calls",
    description: "Interact with deployed Clarity smart contracts. Call functions, read state, and execute transactions on the Stacks blockchain.",
    link: "/stacks/contracts",
    linkText: "Call Contracts",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "DAO Governance",
    description: "Participate in decentralized governance. Create proposals, vote on decisions, and manage treasury funds through the DAO.",
    link: "/dao",
    linkText: "Join DAO",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "NFT Badges",
    description: "Mint and manage privacy badges as NFTs. Earn badges for your contributions and showcase your achievements.",
    link: "/nft",
    linkText: "View NFTs",
    color: "from-yellow-500 to-orange-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function StacksFeaturesSection() {
  const { isSignedIn, walletInfo, network } = useStacks();

  return (
    <section id="stacks" className="py-24 bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Layers className="w-4 h-4" />
            Stacks Blockchain Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built on Stacks
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Leverage the full power of the Stacks blockchain with native USDCx support, 
            Clarity smart contracts, and seamless DeFi integration.
          </p>
        </motion.div>

        {/* Wallet Status Banner */}
        {isSignedIn && walletInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Wallet Connected</h3>
                    <p className="text-sm text-muted-foreground">
                      {network === "mainnet" ? walletInfo.mainnetAddress : walletInfo.testnetAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">STX Balance:</span>
                    <span className="ml-2 font-semibold">{walletInfo.stxBalance?.toFixed(4) || "0.0000"} STX</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">USDCx Balance:</span>
                    <span className="ml-2 font-semibold">{walletInfo.usdcxBalance?.toFixed(2) || "0.00"} USDCx</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stacksFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group flex flex-col"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-4 flex-grow">{feature.description}</p>
              <Link to={feature.link}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                >
                  {feature.linkText}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isSignedIn && (
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
              >
                <Link to="/bot/dashboard" className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 hover:bg-accent"
            >
              <Link to="/bot/dashboard" className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                View Documentation
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
