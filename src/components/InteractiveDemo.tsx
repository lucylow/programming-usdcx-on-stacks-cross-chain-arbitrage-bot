import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Play, Pause, RotateCcw, Zap, CheckCircle, AlertCircle, 
  Clock, Layers, Info, Search, Calculator, Shield, ArrowLeftRight, 
  Cable, AlertTriangle, ExternalLink, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
  icon: string;
}

interface TradeStep {
  step: number;
  icon: string;
  label: string;
  status: "pending" | "active" | "done";
}

const tradeStepDefinitions = [
  { icon: "search", text: "Detecting arbitrage opportunity..." },
  { icon: "calculator", text: "Calculating optimal trade size..." },
  { icon: "shield", text: "Risk assessment passed..." },
  { icon: "swap", text: "Swapping 1,000 USDC on Ethereum..." },
  { icon: "bridge", text: "Bridging to Stacks via Circle xReserve..." },
  { icon: "swap", text: "Swapping to USDCx on Stacks..." },
  { icon: "check", text: "Trade completed successfully!" },
];

const getStepIcon = (iconName: string, isActive: boolean, isDone: boolean) => {
  const className = `w-4 h-4 ${isDone ? "text-success" : isActive ? "text-primary animate-pulse" : "text-muted-foreground"}`;
  
  if (isDone) return <CheckCircle className={className} />;
  
  switch (iconName) {
    case "search": return <Search className={className} />;
    case "calculator": return <Calculator className={className} />;
    case "shield": return <Shield className={className} />;
    case "swap": return <ArrowLeftRight className={className} />;
    case "bridge": return <Cable className={className} />;
    case "check": return <CheckCircle className={className} />;
    default: return <Clock className={className} />;
  }
};

const getLogIcon = (type: LogEntry["type"], iconName?: string) => {
  switch (type) {
    case "success": return <CheckCircle className="w-4 h-4 text-success" />;
    case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
    default: return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

export function InteractiveDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [ethPrice, setEthPrice] = useState(1.0002);
  const [stacksPrice, setStacksPrice] = useState(0.9985);
  const [spread, setSpread] = useState(0.17);
  const [tradesExecuted, setTradesExecuted] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [bridgeQueue, setBridgeQueue] = useState(2);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: "12:00:00", message: "Bot initialized. Monitoring prices...", type: "info", icon: "info" },
  ]);
  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [currentTradeStep, setCurrentTradeStep] = useState(-1);
  const [tradeSteps, setTradeSteps] = useState<TradeStep[]>([]);
  const [ethPriceHistory, setEthPriceHistory] = useState<number[]>(Array(20).fill(1.0002));
  const [stacksPriceHistory, setStacksPriceHistory] = useState<number[]>(Array(20).fill(0.9985));
  
  const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info", icon: string = "info") => {
    const now = new Date();
    const time = now.toTimeString().split(" ")[0];
    setLogs((prev) => {
      const newLogs = [{ time, message, type, icon }, ...prev];
      return newLogs.slice(0, 10); // Keep only last 10 entries
    });
  }, []);

  const updateTradeSteps = useCallback((step: number) => {
    const steps: TradeStep[] = tradeStepDefinitions.slice(0, Math.min(step + 1, tradeStepDefinitions.length)).map((def, idx) => ({
      step: idx,
      icon: def.icon,
      label: def.text,
      status: idx < step ? "done" : idx === step ? "active" : "pending",
    }));
    setTradeSteps(steps);
  }, []);

  const simulatePriceImpact = useCallback((chain: "eth" | "stacks") => {
    if (chain === "eth") {
      setEthPrice((prev) => {
        const newPrice = prev + 0.0002;
        setEthPriceHistory((h) => [...h.slice(1), newPrice]);
        return newPrice;
      });
    } else {
      setStacksPrice((prev) => {
        const newPrice = prev - 0.0003;
        setStacksPriceHistory((h) => [...h.slice(1), newPrice]);
        return newPrice;
      });
    }
  }, []);

  const simulateBridgeTransfer = useCallback(() => {
    setBridgeQueue((prev) => prev + 1);
    setTimeout(() => {
      setBridgeQueue((prev) => Math.max(0, prev - 1));
    }, 2000);
  }, []);

  const executeTrade = useCallback(() => {
    if (tradeInProgress || spread < 0.15 || !isRunning) return;

    setTradeInProgress(true);
    setCurrentTradeStep(0);
    
    addLog("Starting arbitrage trade execution...", "info", "play");

    let step = 0;
    tradeIntervalRef.current = setInterval(() => {
      updateTradeSteps(step);

      switch (step) {
        case 0:
          addLog(`Opportunity detected: ${spread.toFixed(2)}% spread`, "info", "search");
          break;
        case 1:
          addLog("Optimal trade size calculated: $1,000", "info", "calculator");
          break;
        case 2:
          addLog("Risk assessment: Approved", "success", "shield");
          break;
        case 3:
          addLog("Executing swap on Uniswap V3...", "info", "swap");
          simulatePriceImpact("eth");
          break;
        case 4:
          addLog("Initiating bridge transfer via Circle xReserve...", "info", "bridge");
          simulateBridgeTransfer();
          break;
        case 5:
          addLog("Executing swap on ALEX DEX...", "info", "swap");
          simulatePriceImpact("stacks");
          break;
        case 6:
          // Trade completed
          const profit = 42.50 + (Math.random() * 10 - 5);
          setTotalProfit((prev) => prev + profit);
          setTradesExecuted((prev) => prev + 1);
          setSuccessRate(Math.min(100, Math.floor(Math.random() * 10) + 90));

          addLog(`Trade completed! Profit: $${profit.toFixed(2)}`, "success", "check");
          addLog("Resuming price monitoring...", "info", "info");

          if (tradeIntervalRef.current) {
            clearInterval(tradeIntervalRef.current);
            tradeIntervalRef.current = null;
          }
          setTradeInProgress(false);
          setCurrentTradeStep(-1);
          setTradeSteps([]);
          return;
      }

      step++;
      setCurrentTradeStep(step);
    }, 1500);
  }, [tradeInProgress, spread, isRunning, addLog, updateTradeSteps, simulatePriceImpact, simulateBridgeTransfer]);

  const startBot = useCallback(() => {
    setIsRunning(true);
    addLog("Bot started. Monitoring prices across chains...", "info", "play");
  }, [addLog]);

  const pauseBot = useCallback(() => {
    setIsRunning(false);
    addLog("Bot paused.", "warning", "pause");
  }, [addLog]);

  const resetDemo = useCallback(() => {
    // Clear intervals
    if (priceIntervalRef.current) {
      clearInterval(priceIntervalRef.current);
      priceIntervalRef.current = null;
    }
    if (tradeIntervalRef.current) {
      clearInterval(tradeIntervalRef.current);
      tradeIntervalRef.current = null;
    }

    setIsRunning(false);
    setEthPrice(1.0002);
    setStacksPrice(0.9985);
    setSpread(0.17);
    setTradesExecuted(0);
    setTotalProfit(0);
    setSuccessRate(0);
    setBridgeQueue(2);
    setLogs([{ time: "12:00:00", message: "Bot initialized. Monitoring prices...", type: "info", icon: "info" }]);
    setTradeInProgress(false);
    setCurrentTradeStep(-1);
    setTradeSteps([]);
    setEthPriceHistory(Array(20).fill(0).map(() => 1.0000 + Math.random() * 0.0005));
    setStacksPriceHistory(Array(20).fill(0).map(() => 0.9980 + Math.random() * 0.0010));

    addLog("Demo reset to initial state.", "info", "reset");
  }, [addLog]);

  // Price update effect
  useEffect(() => {
    if (!isRunning) {
      if (priceIntervalRef.current) {
        clearInterval(priceIntervalRef.current);
        priceIntervalRef.current = null;
      }
      return;
    }

    priceIntervalRef.current = setInterval(() => {
      setEthPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.0004;
        const newPrice = Math.max(0.999, Math.min(1.0015, prev + change));
        setEthPriceHistory((h) => [...h.slice(1), newPrice]);
        return newPrice;
      });

      setStacksPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.0006;
        const newPrice = Math.max(0.9975, Math.min(1.0025, prev + change));
        setStacksPriceHistory((h) => [...h.slice(1), newPrice]);
        return newPrice;
      });
    }, 1000);

    return () => {
      if (priceIntervalRef.current) {
        clearInterval(priceIntervalRef.current);
        priceIntervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Spread calculation effect
  useEffect(() => {
    const newSpread = (Math.abs(ethPrice - stacksPrice) / Math.min(ethPrice, stacksPrice)) * 100;
    setSpread(newSpread);
  }, [ethPrice, stacksPrice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (tradeIntervalRef.current) clearInterval(tradeIntervalRef.current);
    };
  }, []);

  const potentialProfit = spread > 0.1 ? (spread / 0.17) * 42.5 : 0;
  const avgProfit = tradesExecuted > 0 ? totalProfit / tradesExecuted : 0;
  const canExecuteTrade = spread > 0.15 && !tradeInProgress && isRunning;

  const renderMiniChart = (data: number[], color: string) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 0.001;

    return (
      <svg className="w-full h-12 mt-3" viewBox="0 0 200 48">
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${48 - ((data[0] - min) / range) * 40} ${data
            .map((v, i) => `L ${(i / (data.length - 1)) * 200} ${48 - ((v - min) / range) * 40}`)
            .join(" ")} L 200 48 L 0 48 Z`}
          fill={`url(#gradient-${color.replace("#", "")})`}
        />
        <path
          d={`M 0 ${48 - ((data[0] - min) / range) * 40} ${data
            .map((v, i) => `L ${(i / (data.length - 1)) * 200} ${48 - ((v - min) / range) * 40}`)
            .join(" ")}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <section id="demo" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Live Interactive Demo</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            Experience how our bot detects and executes arbitrage opportunities in real-time.
          </p>
          <Link to="/demo">
            <Button variant="outline" className="mt-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Full Demo Center
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card overflow-hidden"
        >
          {/* Demo Header */}
          <div className="bg-card/80 border-b border-border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">Cross-Chain Arbitrage Bot Simulation</span>
              {isRunning && (
                <span className="flex items-center gap-1.5 text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Running
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => (isRunning ? pauseBot() : startBot())}
                className={`${isRunning ? "bg-warning hover:bg-warning/90" : "bg-gradient-to-r from-primary to-primary-dark"} ${!isRunning ? "animate-pulse" : ""}`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Bot
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Bot
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetDemo}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Main Panel */}
            <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r border-border">
              {/* Price Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  animate={{
                    borderColor: isRunning && Math.random() > 0.85 ? "hsl(228, 80%, 65%)" : "hsl(235, 30%, 18%)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-card/50 rounded-xl p-5 border-t-4 border-t-ethereum border border-border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-ethereum" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                      </svg>
                      <span className="font-medium">Ethereum (Uniswap V3)</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        ethPrice > 1.0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {ethPrice > 1.0 ? "↑" : "↓"} {(Math.abs(ethPrice - 1.0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold">${ethPrice.toFixed(4)}</div>
                  {renderMiniChart(ethPriceHistory, "#627eea")}
                </motion.div>

                <motion.div
                  animate={{
                    borderColor: isRunning && Math.random() > 0.85 ? "hsl(245, 100%, 64%)" : "hsl(235, 30%, 18%)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-card/50 rounded-xl p-5 border-t-4 border-t-stacks border border-border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-stacks" />
                      <span className="font-medium">Stacks (ALEX)</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        stacksPrice > 1.0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {stacksPrice > 1.0 ? "↑" : "↓"} {(Math.abs(stacksPrice - 1.0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold">${stacksPrice.toFixed(4)}</div>
                  {renderMiniChart(stacksPriceHistory, "#5546ff")}
                </motion.div>
              </div>

              {/* Spread Indicator */}
              <motion.div
                animate={{ scale: canExecuteTrade ? [1, 1.01, 1] : 1 }}
                transition={{ repeat: canExecuteTrade ? Infinity : 0, duration: 2 }}
                className="bg-card/50 rounded-xl p-6 text-center mb-8 border border-border"
              >
                <div className="text-muted-foreground mb-2">Arbitrage Spread</div>
                <div
                  className={`text-4xl font-bold mb-2 transition-colors ${
                    spread > 0.15 ? "text-secondary" : "text-muted-foreground"
                  } ${canExecuteTrade ? "animate-glow-pulse" : ""}`}
                >
                  {spread.toFixed(2)}%
                </div>
                <div className="text-muted-foreground mb-4">
                  Potential Profit:{" "}
                  <span className={spread > 0.15 ? "text-secondary font-semibold" : ""}>
                    ${potentialProfit.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={executeTrade}
                  disabled={!canExecuteTrade}
                  className="bg-gradient-to-r from-primary to-primary-dark disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {tradeInProgress
                    ? "Executing..."
                    : !isRunning
                    ? "Start bot first"
                    : spread < 0.15
                    ? "Spread too low"
                    : `Execute Trade ($${potentialProfit.toFixed(2)})`}
                </Button>
              </motion.div>

              {/* Execution Log */}
              <div className="bg-card/50 rounded-xl p-5 border border-border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Execution Log
                </h4>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {logs.map((log, index) => (
                      <motion.div
                        key={`${log.time}-${log.message}-${index}`}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-16 shrink-0">
                          {log.time}
                        </span>
                        {getLogIcon(log.type, log.icon)}
                        <span
                          className={`text-sm ${
                            log.type === "success"
                              ? "text-success"
                              : log.type === "warning"
                              ? "text-warning"
                              : log.type === "error"
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          {log.message}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="p-6 bg-card/30 space-y-6">
              {/* Stats */}
              <div>
                <h4 className="font-semibold mb-4">Bot Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Trades Executed", value: tradesExecuted },
                    { label: "Total Profit", value: `$${totalProfit.toFixed(2)}` },
                    { label: "Success Rate", value: `${successRate}%` },
                    { label: "Avg. Profit", value: `$${avgProfit.toFixed(2)}` },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card/50 rounded-lg p-4 text-center border border-border"
                    >
                      <div className="text-xl font-bold text-secondary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade Steps */}
              <div>
                <h4 className="font-semibold mb-4">Current Trade</h4>
                <div className="space-y-2 bg-card/50 rounded-lg p-4 border border-border min-h-[120px]">
                  {tradeSteps.length > 0 ? (
                    <AnimatePresence>
                      {tradeSteps.map((step) => (
                        <motion.div
                          key={step.step}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 py-1.5"
                        >
                          {getStepIcon(step.icon, step.status === "active", step.status === "done")}
                          <span
                            className={`text-sm ${
                              step.status === "done"
                                ? "text-success"
                                : step.status === "active"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground py-1.5">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Waiting for opportunity...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bridge Status */}
              <div>
                <h4 className="font-semibold mb-4">Bridge Status</h4>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium">Circle xReserve: Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Queue:</span>
                    <span className="font-medium">{bridgeQueue} operations</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Avg. Time:</span>
                    <span className="font-medium">~45s</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h5 className="font-medium text-sm mb-2 text-primary">How to Use</h5>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click "Start Bot" to begin monitoring</li>
                  <li>Watch for spread &gt; 0.15%</li>
                  <li>Click "Execute Trade" when available</li>
                  <li>Follow the trade execution steps</li>
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
