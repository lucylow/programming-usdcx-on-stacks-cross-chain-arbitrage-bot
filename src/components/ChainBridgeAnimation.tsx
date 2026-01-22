import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cable, ArrowRight, CheckCircle2, Clock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BridgeTransaction {
  id: string;
  amount: number;
  from: "ethereum" | "stacks";
  to: "ethereum" | "stacks";
  status: "pending" | "bridging" | "completed";
  progress: number;
  startTime: number;
}

export function ChainBridgeAnimation() {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const createTransaction = () => {
    const amount = 500 + Math.random() * 1500;
    const direction = Math.random() > 0.5 ? "ethereum" : "stacks";
    
    const newTx: BridgeTransaction = {
      id: `tx_${Date.now()}`,
      amount,
      from: direction,
      to: direction === "ethereum" ? "stacks" : "ethereum",
      status: "pending",
      progress: 0,
      startTime: Date.now()
    };

    setTransactions(prev => [newTx, ...prev.slice(0, 4)]);
    
    // Start bridging after a short delay
    setTimeout(() => {
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: "bridging" as const } : tx
      ));
    }, 1000);
  };

  useEffect(() => {
    // Simulate bridge progress
    const interval = setInterval(() => {
      setTransactions(prev => prev.map(tx => {
        if (tx.status === "bridging") {
          const elapsed = Date.now() - tx.startTime;
          const duration = 45000; // 45 seconds
          const progress = Math.min(100, (elapsed / duration) * 100);
          
          if (progress >= 100) {
            return { ...tx, status: "completed" as const, progress: 100 };
          }
          
          return { ...tx, progress };
        }
        return tx;
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cable className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Chain Bridge Animation</h3>
        </div>
        <Button
          onClick={createTransaction}
          className="bg-gradient-to-r from-primary to-primary-dark"
        >
          Simulate Bridge
        </Button>
      </div>

      {/* Bridge Visualization */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between">
          {/* Ethereum Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <Card className="bg-card/30 border-2 border-ethereum/50 p-6 text-center">
              <Layers className="w-8 h-8 text-ethereum mx-auto mb-2" />
              <div className="font-semibold mb-1">Ethereum</div>
              <div className="text-sm text-muted-foreground">Uniswap V3</div>
            </Card>
          </motion.div>

          {/* Bridge Connection */}
          <div className="relative mx-8 flex-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-0.5 bg-primary/30" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-card border-2 border-primary rounded-full p-3">
                <Cable className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            {/* Animated Asset */}
            <AnimatePresence>
              {transactions.filter(tx => tx.status === "bridging").map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ x: tx.from === "ethereum" ? -200 : 200, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
                    ${tx.amount.toFixed(0)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Stacks Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <Card className="bg-card/30 border-2 border-stacks/50 p-6 text-center">
              <Layers className="w-8 h-8 text-stacks mx-auto mb-2" />
              <div className="font-semibold mb-1">Stacks</div>
              <div className="text-sm text-muted-foreground">ALEX DEX</div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <div className="text-sm font-semibold mb-4">Active Bridge Transactions</div>
        <AnimatePresence>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cable className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active bridge transactions</p>
              <p className="text-sm mt-2">Click "Simulate Bridge" to start</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/30 rounded-lg p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${tx.status === "completed" ? "bg-success/20 text-success" :
                        tx.status === "bridging" ? "bg-primary/20 text-primary animate-pulse" :
                        "bg-muted/20 text-muted-foreground"}
                    `}>
                      {tx.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : tx.status === "bridging" ? (
                        <Cable className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">${tx.amount.toFixed(2)} USDC</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.from.charAt(0).toUpperCase() + tx.from.slice(1)} → {tx.to.charAt(0).toUpperCase() + tx.to.slice(1)}
                      </div>
                    </div>
                  </div>
                  <Badge className={
                    tx.status === "completed" ? "bg-success/20 text-success" :
                    tx.status === "bridging" ? "bg-primary/20 text-primary" :
                    "bg-muted/20 text-muted-foreground"
                  }>
                    {tx.status}
                  </Badge>
                </div>

                {tx.status === "bridging" && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Bridge Progress</span>
                      <span>{tx.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tx.progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-primary-dark"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estimated time remaining: {Math.max(0, Math.ceil((100 - tx.progress) * 0.45))}s
                    </div>
                  </div>
                )}

                {tx.status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-success mt-2"
                  >
                    ✓ Bridge completed successfully
                  </motion.div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTransaction(tx.id)}
                  className="mt-2 text-xs"
                >
                  Remove
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

