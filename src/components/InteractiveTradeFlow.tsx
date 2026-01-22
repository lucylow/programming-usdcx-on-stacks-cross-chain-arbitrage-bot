import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, CheckCircle2, Clock, AlertCircle, 
  Zap, Shield, Cable, Layers, Search, Calculator,
  TrendingUp, DollarSign, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlowStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "completed" | "error";
  duration?: number;
  details?: string;
}

export function InteractiveTradeFlow() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<FlowStep[]>([
    {
      id: "detect",
      name: "Opportunity Detection",
      icon: <Search className="w-5 h-5" />,
      status: "pending",
      duration: 500,
      details: "Scanning DEXs for price discrepancies..."
    },
    {
      id: "calculate",
      name: "Profit Calculation",
      icon: <Calculator className="w-5 h-5" />,
      status: "pending",
      duration: 300,
      details: "Computing optimal trade size and expected profit..."
    },
    {
      id: "risk",
      name: "Risk Assessment",
      icon: <Shield className="w-5 h-5" />,
      status: "pending",
      duration: 400,
      details: "Evaluating market conditions and slippage risks..."
    },
    {
      id: "swap1",
      name: "Ethereum Swap",
      icon: <Layers className="w-5 h-5" />,
      status: "pending",
      duration: 2000,
      details: "Executing swap on Uniswap V3..."
    },
    {
      id: "bridge",
      name: "Cross-Chain Bridge",
      icon: <Cable className="w-5 h-5" />,
      status: "pending",
      duration: 45000,
      details: "Bridging assets via Circle xReserve..."
    },
    {
      id: "swap2",
      name: "Stacks Swap",
      icon: <Layers className="w-5 h-5" />,
      status: "pending",
      duration: 2000,
      details: "Executing swap on ALEX DEX..."
    },
    {
      id: "complete",
      name: "Trade Complete",
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: "pending",
      duration: 0,
      details: "Trade executed successfully!"
    }
  ]);

  const [profit, setProfit] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);

  const startFlow = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setProfit(0);
    setExecutionTime(0);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: "pending" as const })));
    
    // Start execution
    executeStep(0);
  };

  const executeStep = (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setIsRunning(false);
      return;
    }

    // Update current step to active
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex 
        ? { ...step, status: "active" as const }
        : idx < stepIndex
        ? { ...step, status: "completed" as const }
        : step
    ));
    setCurrentStep(stepIndex);

    const step = steps[stepIndex];
    const duration = step.duration || 1000;

    // Update execution time
    setExecutionTime(prev => prev + duration);

    // Simulate step completion
    setTimeout(() => {
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex 
          ? { ...step, status: "completed" as const }
          : step
      ));

      // If this is the last step, calculate profit
      if (stepIndex === steps.length - 1) {
        const calculatedProfit = 42.50 + Math.random() * 10;
        setProfit(calculatedProfit);
        setIsRunning(false);
      } else {
        // Move to next step
        executeStep(stepIndex + 1);
      }
    }, duration);
  };

  const resetFlow = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setProfit(0);
    setExecutionTime(0);
    setSteps(prev => prev.map(step => ({ ...step, status: "pending" as const })));
  };

  const getStatusColor = (status: FlowStep["status"]) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success border-success/30";
      case "active": return "bg-primary/20 text-primary border-primary/30 animate-pulse";
      case "error": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getStatusIcon = (status: FlowStep["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "active": return <Activity className="w-4 h-4 animate-spin" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Interactive Trade Flow</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startFlow}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-primary-dark"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Flow
          </Button>
          <Button
            onClick={resetFlow}
            variant="outline"
            disabled={isRunning}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="relative mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 w-full md:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: step.status === "active" ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center flex-1"
              >
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${getStatusColor(step.status)}
                  ${step.status === "active" ? "ring-4 ring-primary/30" : ""}
                `}>
                  {getStatusIcon(step.status) || step.icon}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.name}</div>
                  {step.status === "active" && step.details && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground mt-1"
                    >
                      {step.details}
                    </motion.div>
                  )}
                </div>
              </motion.div>
              
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: step.status === "completed" || step.status === "active" ? 1 : 0,
                  }}
                  className="hidden md:block mx-2 h-0.5 bg-primary flex-1"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Execution Time</span>
          </div>
          <div className="text-2xl font-bold">
            {isRunning ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {(executionTime / 1000).toFixed(1)}s
              </motion.span>
            ) : (
              executionTime > 0 ? `${(executionTime / 1000).toFixed(1)}s` : "—"
            )}
          </div>
        </div>

        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Current Step</span>
          </div>
          <div className="text-2xl font-bold">
            {isRunning ? `${currentStep + 1}/${steps.length}` : "—"}
          </div>
        </div>

        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Estimated Profit</span>
          </div>
          <motion.div
            key={profit}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-success"
          >
            {profit > 0 ? `$${profit.toFixed(2)}` : "—"}
          </motion.div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-medium">
            {Math.round((currentStep / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-primary-dark"
          />
        </div>
      </div>
    </Card>
  );
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

