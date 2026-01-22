import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface PrivacyScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function PrivacyScoreGauge({ score, size = "md" }: PrivacyScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const sizeConfig = {
    sm: { width: 120, stroke: 8, fontSize: "text-2xl" },
    md: { width: 180, stroke: 12, fontSize: "text-4xl" },
    lg: { width: 240, stroke: 16, fontSize: "text-5xl" },
  };
  
  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return { stroke: "#00d4aa", bg: "from-secondary/20 to-secondary/5" };
    if (score >= 70) return { stroke: "#5546ff", bg: "from-primary/20 to-primary/5" };
    if (score >= 50) return { stroke: "#f59e0b", bg: "from-yellow-500/20 to-yellow-500/5" };
    return { stroke: "#ef4444", bg: "from-red-500/20 to-red-500/5" };
  };
  
  const colors = getScoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Background glow */}
      <div 
        className={`absolute inset-0 bg-gradient-radial ${colors.bg} rounded-full blur-2xl opacity-50`}
        style={{ width: config.width + 40, height: config.width + 40, margin: -20 }}
      />
      
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          className="text-border/30"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={config.stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${colors.stroke}40)`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Shield className="w-6 h-6 text-secondary mb-1" />
        <motion.span
          className={`${config.fontSize} font-bold`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(animatedScore)}
        </motion.span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Privacy Score
        </span>
      </div>
    </div>
  );
}
