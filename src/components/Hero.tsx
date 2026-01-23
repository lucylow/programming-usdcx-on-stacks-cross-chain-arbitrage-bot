import { motion } from "framer-motion";
import { Trophy, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { value: "0.5%+", label: "Avg. Profit per Trade" },
  { value: "45s", label: "Avg. Execution Time" },
  { value: "95%", label: "Success Rate" },
  { value: "$3K", label: "Hackathon Prize" },
] as const;

// Memoized stat card component
const StatCard = memo(({ stat, index }: { stat: typeof stats[number]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7 + index * 0.1 }}
    className="flex flex-col items-center"
  >
    <span className="text-3xl md:text-4xl font-bold text-secondary">
      {stat.value}
    </span>
    <span className="text-sm text-muted-foreground mt-2">{stat.label}</span>
  </motion.div>
));
StatCard.displayName = "StatCard";

export const Hero = memo(() => {
  const memoizedStats = useMemo(() => stats, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsla(245,100%,64%,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsla(162,100%,42%,0.08),transparent_40%)]" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-semibold mb-8"
          >
            <Trophy className="w-4 h-4" />
            Stacks USDCx Hackathon Submission
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 gradient-text">
            Programmatic Cross-Chain Arbitrage Bot
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
            An automated trading system that captures profit opportunities between Ethereum and Stacks ecosystems 
            by leveraging USDCx and Circle's xReserve programmatic bridge.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 text-lg px-8 py-6 glow-primary"
            >
              <Link to="/bot" className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Launch Interactive Demo
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-20"
            role="list"
            aria-label="Key statistics"
          >
            {memoizedStats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});
Hero.displayName = "Hero";
