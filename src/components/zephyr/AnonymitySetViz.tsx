import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

interface AnonymitySetVizProps {
  totalUsers: number;
  yourPosition?: number;
}

export function AnonymitySetViz({ totalUsers, yourPosition = 5247 }: AnonymitySetVizProps) {
  const [dots, setDots] = useState<{ x: number; y: number; delay: number; highlighted: boolean }[]>([]);

  useEffect(() => {
    // Generate random dots for visualization
    const newDots = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      highlighted: i === Math.floor(Math.random() * 80), // Random "you" position
    }));
    setDots(newDots);
  }, []);

  return (
    <div className="relative">
      {/* Visualization Container */}
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border overflow-hidden">
        {/* Animated dots representing users */}
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              dot.highlighted 
                ? "bg-secondary shadow-lg shadow-secondary/50" 
                : "bg-primary/40"
            }`}
            style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: dot.highlighted ? 1 : [0.3, 0.7, 0.3],
              scale: dot.highlighted ? [1, 1.5, 1] : 1,
            }}
            transition={{
              delay: dot.delay,
              duration: dot.highlighted ? 1.5 : 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}

        {/* Center indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="px-4 py-2 rounded-full bg-background/90 backdrop-blur-sm border border-secondary/30 shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">You are hidden among</span>
              <span className="font-bold text-secondary">{totalUsers.toLocaleString()}</span>
              <span className="text-sm font-medium">users</span>
            </div>
          </motion.div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Stats below */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
          <div className="text-2xl font-bold text-primary">{totalUsers.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Pool Size</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
          <div className="text-2xl font-bold text-secondary">13.3</div>
          <div className="text-xs text-muted-foreground">Entropy Bits</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
          <div className="text-2xl font-bold text-primary">Top 5%</div>
          <div className="text-xs text-muted-foreground">Your Ranking</div>
        </div>
      </div>
    </div>
  );
}
