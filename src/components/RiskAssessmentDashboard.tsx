import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, TrendingDown, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RiskFactor {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: "safe" | "warning" | "danger";
  description: string;
}

export function RiskAssessmentDashboard() {
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
    {
      id: "slippage",
      name: "Slippage Risk",
      value: 0.15,
      threshold: 0.5,
      status: "safe",
      description: "Price impact during trade execution"
    },
    {
      id: "liquidity",
      name: "Liquidity Risk",
      value: 85,
      threshold: 50,
      status: "safe",
      description: "Available liquidity on target DEX"
    },
    {
      id: "volatility",
      name: "Market Volatility",
      value: 0.8,
      threshold: 2.0,
      status: "safe",
      description: "Price volatility in last 24h"
    },
    {
      id: "bridge",
      name: "Bridge Delay",
      value: 45,
      threshold: 120,
      status: "safe",
      description: "Estimated bridge completion time (seconds)"
    },
    {
      id: "gas",
      name: "Gas Price",
      value: 35,
      threshold: 100,
      status: "safe",
      description: "Current gas price (gwei)"
    }
  ]);

  const [overallRisk, setOverallRisk] = useState(0);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    // Simulate real-time risk updates
    const interval = setInterval(() => {
      setRiskFactors(prev => prev.map(factor => {
        let newValue = factor.value;
        
        // Add some randomness to simulate market changes
        if (factor.id === "slippage") {
          newValue = 0.1 + Math.random() * 0.2;
        } else if (factor.id === "liquidity") {
          newValue = 70 + Math.random() * 20;
        } else if (factor.id === "volatility") {
          newValue = 0.5 + Math.random() * 1.5;
        } else if (factor.id === "bridge") {
          newValue = 30 + Math.random() * 30;
        } else if (factor.id === "gas") {
          newValue = 20 + Math.random() * 40;
        }

        // Determine status based on value vs threshold
        let status: "safe" | "warning" | "danger" = "safe";
        if (factor.id === "liquidity") {
          // For liquidity, higher is better
          status = newValue < factor.threshold ? "danger" : newValue < factor.threshold * 1.5 ? "warning" : "safe";
        } else {
          // For others, lower is better
          status = newValue > factor.threshold ? "danger" : newValue > factor.threshold * 0.7 ? "warning" : "safe";
        }

        return { ...factor, value: newValue, status };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate overall risk score
    const dangerCount = riskFactors.filter(f => f.status === "danger").length;
    const warningCount = riskFactors.filter(f => f.status === "warning").length;
    
    const riskScore = (dangerCount * 50 + warningCount * 25) / riskFactors.length;
    setOverallRisk(riskScore);

    if (riskScore > 40) {
      setRiskLevel("high");
    } else if (riskScore > 20) {
      setRiskLevel("medium");
    } else {
      setRiskLevel("low");
    }
  }, [riskFactors]);

  const getStatusColor = (status: RiskFactor["status"]) => {
    switch (status) {
      case "safe": return "bg-success/20 text-success border-success/30";
      case "warning": return "bg-warning/20 text-warning border-warning/30";
      case "danger": return "bg-destructive/20 text-destructive border-destructive/30";
    }
  };

  const getStatusIcon = (status: RiskFactor["status"]) => {
    switch (status) {
      case "safe": return <CheckCircle2 className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "danger": return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case "low": return "text-success";
      case "medium": return "text-warning";
      case "high": return "text-destructive";
    }
  };

  const getRiskLevelBg = () => {
    switch (riskLevel) {
      case "low": return "bg-success/10 border-success/30";
      case "medium": return "bg-warning/10 border-warning/30";
      case "high": return "bg-destructive/10 border-destructive/30";
    }
  };

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">Risk Assessment Dashboard</h3>
      </div>

      {/* Overall Risk Score */}
      <motion.div
        key={overallRisk}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        className={`${getRiskLevelBg()} rounded-xl p-6 mb-6 border-2`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Overall Risk Score</div>
            <div className={`text-4xl font-bold ${getRiskLevelColor()}`}>
              {overallRisk.toFixed(0)}%
            </div>
          </div>
          <Badge className={`${getStatusColor(riskLevel === "low" ? "safe" : riskLevel === "medium" ? "warning" : "danger")} text-lg px-4 py-2`}>
            {riskLevel.toUpperCase()} RISK
          </Badge>
        </div>
        <Progress value={overallRisk} className="h-3" />
      </motion.div>

      {/* Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riskFactors.map((factor) => (
          <motion.div
            key={factor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`bg-card/30 p-4 border-2 ${getStatusColor(factor.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(factor.status)}
                  <span className="font-semibold text-sm">{factor.name}</span>
                </div>
                <Badge className={getStatusColor(factor.status)}>
                  {factor.status}
                </Badge>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{factor.description}</span>
                  <span>
                    {factor.id === "liquidity" ? `${factor.value.toFixed(0)}%` : 
                     factor.id === "bridge" ? `${factor.value.toFixed(0)}s` :
                     factor.id === "gas" ? `${factor.value.toFixed(0)} gwei` :
                     `${factor.value.toFixed(2)}%`}
                  </span>
                </div>
                <Progress 
                  value={
                    factor.id === "liquidity" 
                      ? factor.value 
                      : (factor.value / factor.threshold) * 100
                  } 
                  className="h-2"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Threshold: {
                  factor.id === "liquidity" ? `${factor.threshold}%` :
                  factor.id === "bridge" ? `${factor.threshold}s` :
                  factor.id === "gas" ? `${factor.threshold} gwei` :
                  `${factor.threshold}%`
                }
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Risk Summary */}
      <div className="mt-6 p-4 bg-card/30 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Risk Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-success">
              {riskFactors.filter(f => f.status === "safe").length}
            </div>
            <div className="text-xs text-muted-foreground">Safe</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">
              {riskFactors.filter(f => f.status === "warning").length}
            </div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-destructive">
              {riskFactors.filter(f => f.status === "danger").length}
            </div>
            <div className="text-xs text-muted-foreground">Danger</div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={riskLevel === "high"}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
            riskLevel === "high"
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : riskLevel === "medium"
              ? "bg-warning hover:bg-warning/80 text-white"
              : "bg-success hover:bg-success/80 text-white"
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          {riskLevel === "high" 
            ? "Risk Too High - Trade Blocked" 
            : riskLevel === "medium"
            ? "Proceed with Caution"
            : "Safe to Execute Trade"}
        </motion.button>
      </div>
    </Card>
  );
}

