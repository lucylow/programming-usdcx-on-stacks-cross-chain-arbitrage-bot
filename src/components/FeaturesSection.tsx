import { motion } from "framer-motion";
import { Zap, Calculator, Shield, Cable, Fuel, LineChart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Real-time Monitoring",
    description: "Continuously tracks prices across multiple DEXs on both Ethereum and Stacks with sub-second updates.",
    link: "/bot/dashboard",
    linkText: "View Dashboard",
  },
  {
    icon: Calculator,
    title: "Profit Optimization",
    description: "Calculates optimal trade sizes considering gas costs, bridge fees, and slippage for maximum ROI.",
    link: "/bot/opportunities",
    linkText: "See Opportunities",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Circuit breakers, stop losses, and position limits protect capital during market volatility.",
    link: "/analytics/risk",
    linkText: "Risk Analytics",
  },
  {
    icon: Cable,
    title: "Bridge Integration",
    description: "Deep integration with Circle's xReserve programmatic bridge for seamless cross-chain transfers.",
    link: "/bot/dashboard",
    linkText: "Explore Bot",
  },
  {
    icon: Fuel,
    title: "Gas Optimization",
    description: "Dynamic gas pricing and batch processing minimize transaction costs and maximize profits.",
    link: "/bot/history",
    linkText: "View History",
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description: "Comprehensive dashboard with real-time metrics, trade history, and performance analysis.",
    link: "/analytics",
    linkText: "View Analytics",
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

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Advanced Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our bot incorporates sophisticated mechanisms for optimal performance and risk management.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="glass-card p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group flex flex-col"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
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
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
          >
            <Link to="/bot/dashboard" className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Launch Bot Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
