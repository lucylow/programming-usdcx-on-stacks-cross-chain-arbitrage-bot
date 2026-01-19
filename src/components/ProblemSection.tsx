import { motion } from "framer-motion";
import { ArrowLeftRight, Hand, Fuel, Shield } from "lucide-react";

const problems = [
  {
    icon: ArrowLeftRight,
    title: "Price Discrepancies",
    description: "USDC/USDCx prices can vary significantly between Ethereum and Stacks DEXs due to fragmented liquidity and bridge latency.",
  },
  {
    icon: Hand,
    title: "Manual Processes",
    description: "Traders must manually monitor prices, execute swaps, and manage bridge transfers, missing profitable opportunities.",
  },
  {
    icon: Fuel,
    title: "High Gas Costs",
    description: "Manual arbitrage operations incur significant gas fees that erode profit margins, especially for smaller trades.",
  },
  {
    icon: Shield,
    title: "Bridge Settlement Risk",
    description: "Price movements during bridge settlement can turn profitable opportunities into losses without proper risk management.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-card/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Market Inefficiency Problem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            USDCx creates a novel financial primitive where the same asset exists across two separate DeFi ecosystems with different pricing dynamics.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {problems.map((problem) => (
            <motion.div
              key={problem.title}
              variants={cardVariants}
              className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-5 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground">{problem.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
