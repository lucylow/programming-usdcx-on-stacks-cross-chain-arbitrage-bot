import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Play, RotateCcw, Zap, CheckCircle, AlertCircle, Clock, Layers, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface TradeStep {
  step: number;
  label: string;
  status: "pending" | "active" | "done";
}

export function InteractiveDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [ethPrice, setEthPrice] = useState(1.0002);
  const [stacksPrice, setStacksPrice] = useState(0.9985);
  const [spread, setSpread] = useState(0.17);
  const [tradesExecuted, setTradesExecuted] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: "12:00:00", message: "Bot initialized. Monitoring prices...", type: "info" },
  ]);
  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [tradeSteps, setTradeSteps] = useState<TradeStep[]>([]);
  const [ethPriceHistory, setEthPriceHistory] = useState<number[]>(Array(20).fill(1.0002));
  const [stacksPriceHistory, setStacksPriceHistory] = useState<number[]>(Array(20).fill(0.9985));

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = now.toTimeString().split(" ")[0];
    setLogs((prev) => [...prev.slice(-9), { time, message, type }]);
  }, []);

  const resetDemo = useCallback(() => {
    setIsRunning(false);
    setEthPrice(1.0002);
    setStacksPrice(0.9985);
    setSpread(0.17);
    setTradesExecuted(0);
    setTotalProfit(0);
    setLogs([{ time: "12:00:00", message: "Bot initialized. Monitoring prices...", type: "info" }]);
    setTradeInProgress(false);
    setTradeSteps([]);
    setEthPriceHistory(Array(20).fill(1.0002));
    setStacksPriceHistory(Array(20).fill(0.9985));
  }, []);

  const executeTrade = useCallback(async () => {
    if (tradeInProgress || spread < 0.15) return;
    
    setTradeInProgress(true);
    const profit = spread * 10;
    
    const steps: TradeStep[] = [
      { step: 1, label: "Detecting opportunity...", status: "active" },
      { step: 2, label: "Buying USDCx on Stacks (ALEX)", status: "pending" },
      { step: 3, label: "Bridging via Circle xReserve", status: "pending" },
      { step: 4, label: "Selling USDC on Ethereum (Uniswap)", status: "pending" },
      { step: 5, label: "Confirming profit", status: "pending" },
    ];
    
    setTradeSteps(steps);
    addLog("Arbitrage opportunity detected!", "warning");

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setTradeSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i + 1 ? "done" : idx === i + 1 ? "active" : "pending",
        }))
      );
      addLog(steps[i].label.replace("...", " complete"), i === steps.length - 1 ? "success" : "info");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setTradesExecuted((prev) => prev + 1);
    setTotalProfit((prev) => prev + profit);
    addLog(`Trade completed! Profit: $${profit.toFixed(2)}`, "success");
    setTradeInProgress(false);
    setTradeSteps([]);
  }, [tradeInProgress, spread, addLog]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
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
    }, 800);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const newSpread = (Math.abs(ethPrice - stacksPrice) / Math.min(ethPrice, stacksPrice)) * 100;
    setSpread(newSpread);
  }, [ethPrice, stacksPrice]);

  const potentialProfit = spread > 0.1 ? spread * 10 : 0;
  const successRate = tradesExecuted > 0 ? 95 : 0;
  const avgProfit = tradesExecuted > 0 ? totalProfit / tradesExecuted : 0;

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-success" />;
      case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-warning" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderMiniChart = (data: number[], color: string) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 0.001;
    
    return (
      <svg className="w-full h-12 mt-3" viewBox="0 0 200 48">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${48 - ((data[0] - min) / range) * 40} ${data
            .map((v, i) => `L ${(i / (data.length - 1)) * 200} ${48 - ((v - min) / range) * 40}`)
            .join(" ")} L 200 48 L 0 48 Z`}
          fill={`url(#gradient-${color})`}
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Interactive Demo</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience how our bot detects and executes arbitrage opportunities in real-time.
          </p>
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
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={isRunning ? "bg-warning hover:bg-warning/90" : "bg-gradient-to-r from-primary to-primary-dark"}
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Pause" : "Start Bot"}
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
                  animate={{ borderColor: isRunning && Math.random() > 0.7 ? "hsl(var(--ethereum))" : "hsl(var(--border))" }}
                  className="bg-card/50 rounded-xl p-5 border-t-4 border-t-ethereum border border-border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-ethereum" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                      </svg>
                      <span className="font-medium">Ethereum (Uniswap V3)</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${ethPrice > 1.0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {ethPrice > 1.0 ? "↑" : "↓"} {(Math.abs(ethPrice - 1.0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold">${ethPrice.toFixed(4)}</div>
                  {renderMiniChart(ethPriceHistory, "#627eea")}
                </motion.div>

                <motion.div
                  animate={{ borderColor: isRunning && Math.random() > 0.7 ? "hsl(var(--stacks))" : "hsl(var(--border))" }}
                  className="bg-card/50 rounded-xl p-5 border-t-4 border-t-stacks border border-border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-stacks" />
                      <span className="font-medium">Stacks (ALEX)</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${stacksPrice > 1.0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {stacksPrice > 1.0 ? "↑" : "↓"} {(Math.abs(stacksPrice - 1.0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold">${stacksPrice.toFixed(4)}</div>
                  {renderMiniChart(stacksPriceHistory, "#5546ff")}
                </motion.div>
              </div>

              {/* Spread Indicator */}
              <motion.div
                animate={{ scale: spread > 0.15 ? [1, 1.02, 1] : 1 }}
                transition={{ repeat: spread > 0.15 ? Infinity : 0, duration: 2 }}
                className="bg-card/50 rounded-xl p-6 text-center mb-8 border border-border"
              >
                <div className="text-muted-foreground mb-2">Arbitrage Spread</div>
                <div className={`text-4xl font-bold mb-2 ${spread > 0.15 ? "text-secondary animate-glow-pulse" : "text-muted-foreground"}`}>
                  {spread.toFixed(2)}%
                </div>
                <div className="text-muted-foreground mb-4">
                  Potential Profit: <span className={spread > 0.15 ? "text-secondary font-semibold" : ""}>${potentialProfit.toFixed(2)}</span>
                </div>
                <Button
                  onClick={executeTrade}
                  disabled={spread < 0.15 || tradeInProgress || !isRunning}
                  className="bg-gradient-to-r from-primary to-primary-dark disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {tradeInProgress ? "Executing..." : spread < 0.15 ? "Spread too low" : `Execute Trade ($${potentialProfit.toFixed(2)})`}
                </Button>
              </motion.div>

              {/* Execution Log */}
              <div className="bg-card/50 rounded-xl p-5 border border-border">
                <h4 className="font-semibold mb-4">Execution Log</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <AnimatePresence>
                    {logs.map((log, index) => (
                      <motion.div
                        key={`${log.time}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-16">{log.time}</span>
                        {getLogIcon(log.type)}
                        <span className="text-sm">{log.message}</span>
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
                    <div key={stat.label} className="bg-card/50 rounded-lg p-4 text-center border border-border">
                      <div className="text-xl font-bold text-secondary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade Steps */}
              <div>
                <h4 className="font-semibold mb-4">Current Trade</h4>
                <div className="space-y-2">
                  {tradeSteps.length > 0 ? (
                    tradeSteps.map((step) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 py-2"
                      >
                        {step.status === "done" ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : step.status === "active" ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                            <Clock className="w-4 h-4 text-primary" />
                          </motion.div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                        )}
                        <span className={`text-sm ${step.status === "active" ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
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
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm">Circle xReserve: Ready</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Queue: {tradeInProgress ? 1 : 0} operations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
