import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Settings, TrendingUp, DollarSign, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface SimulationResult {
  success: boolean;
  profit: number;
  executionTime: number;
  gasUsed: number;
  bridgeTime: number;
  slippage: number;
  finalAmount: number;
}

export function TradeSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  
  // Simulation parameters
  const [initialAmount, setInitialAmount] = useState(1000);
  const [spread, setSpread] = useState(0.17);
  const [gasPrice, setGasPrice] = useState(30);
  const [bridgeDelay, setBridgeDelay] = useState(45);
  const [slippageTolerance, setSlippageTolerance] = useState(0.1);
  const [iterations, setIterations] = useState(1);

  const [currentSimulation, setCurrentSimulation] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const runSimulation = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentSimulation(null);
    setProgress(0);

    for (let i = 0; i < iterations; i++) {
      setProgress((i / iterations) * 100);

      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate results with some randomness
      const actualSlippage = slippageTolerance * (0.5 + Math.random());
      const gasUsed = gasPrice * (0.8 + Math.random() * 0.4);
      const actualBridgeTime = bridgeDelay * (0.8 + Math.random() * 0.4);
      const executionTime = 2000 + actualBridgeTime * 1000 + 2000;
      
      const grossProfit = (initialAmount * spread) / 100;
      const slippageLoss = (initialAmount * actualSlippage) / 100;
      const totalFees = gasUsed + 10; // gas + bridge fees
      const netProfit = grossProfit - slippageLoss - totalFees;
      
      const success = netProfit > 0;
      const finalAmount = initialAmount + (success ? netProfit : -Math.abs(netProfit));

      const result: SimulationResult = {
        success,
        profit: netProfit,
        executionTime,
        gasUsed,
        bridgeTime: actualBridgeTime,
        slippage: actualSlippage,
        finalAmount
      };

      setCurrentSimulation(result);
      setResults(prev => [...prev, result]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProgress(100);
    setIsRunning(false);
    setCurrentSimulation(null);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setResults([]);
    setCurrentSimulation(null);
    setProgress(0);
  };

  const avgProfit = results.length > 0
    ? results.reduce((sum, r) => sum + r.profit, 0) / results.length
    : 0;
  const successRate = results.length > 0
    ? (results.filter(r => r.success).length / results.length) * 100
    : 0;
  const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Trade Simulator</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-primary-dark"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Run Simulation"}
          </Button>
          <Button
            onClick={resetSimulation}
            variant="outline"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Panel */}
        <div className="space-y-4">
          <h4 className="font-semibold mb-4">Simulation Parameters</h4>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="initialAmount">Initial Amount (USDC)</Label>
              <span className="text-sm text-muted-foreground">${initialAmount}</span>
            </div>
            <Slider
              id="initialAmount"
              min={100}
              max={10000}
              step={100}
              value={[initialAmount]}
              onValueChange={([value]) => setInitialAmount(value)}
            />
            <Input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Math.max(100, Math.min(10000, Number(e.target.value))))}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="spread">Spread (%)</Label>
              <span className="text-sm text-muted-foreground">{spread.toFixed(2)}%</span>
            </div>
            <Slider
              id="spread"
              min={0.05}
              max={2}
              step={0.01}
              value={[spread]}
              onValueChange={([value]) => setSpread(value)}
            />
            <Input
              type="number"
              value={spread}
              onChange={(e) => setSpread(Math.max(0.05, Math.min(2, Number(e.target.value))))}
              step="0.01"
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="gasPrice">Gas Price (gwei)</Label>
              <span className="text-sm text-muted-foreground">{gasPrice}</span>
            </div>
            <Slider
              id="gasPrice"
              min={10}
              max={200}
              step={5}
              value={[gasPrice]}
              onValueChange={([value]) => setGasPrice(value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="bridgeDelay">Bridge Delay (seconds)</Label>
              <span className="text-sm text-muted-foreground">{bridgeDelay}s</span>
            </div>
            <Slider
              id="bridgeDelay"
              min={30}
              max={120}
              step={5}
              value={[bridgeDelay]}
              onValueChange={([value]) => setBridgeDelay(value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="slippageTolerance">Slippage Tolerance (%)</Label>
              <span className="text-sm text-muted-foreground">{slippageTolerance.toFixed(2)}%</span>
            </div>
            <Slider
              id="slippageTolerance"
              min={0.05}
              max={1}
              step={0.05}
              value={[slippageTolerance]}
              onValueChange={([value]) => setSlippageTolerance(value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="iterations">Iterations</Label>
              <span className="text-sm text-muted-foreground">{iterations}</span>
            </div>
            <Slider
              id="iterations"
              min={1}
              max={10}
              step={1}
              value={[iterations]}
              onValueChange={([value]) => setIterations(value)}
            />
          </div>
        </div>

        {/* Current Simulation */}
        <div className="space-y-4">
          <h4 className="font-semibold mb-4">Current Simulation</h4>
          
          {isRunning && (
            <div className="bg-card/30 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary to-primary-dark"
                />
              </div>
            </div>
          )}

          <AnimatePresence>
            {currentSimulation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-card/30 rounded-lg p-4 border-2 ${
                  currentSimulation.success 
                    ? "border-success/50 bg-success/5" 
                    : "border-destructive/50 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Result</span>
                  <Badge className={
                    currentSimulation.success 
                      ? "bg-success/20 text-success" 
                      : "bg-destructive/20 text-destructive"
                  }>
                    {currentSimulation.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className={`font-semibold ${currentSimulation.profit >= 0 ? "text-success" : "text-destructive"}`}>
                      ${currentSimulation.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final Amount:</span>
                    <span className="font-semibold">${currentSimulation.finalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution Time:</span>
                    <span className="font-semibold">{(currentSimulation.executionTime / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Used:</span>
                    <span className="font-semibold">${currentSimulation.gasUsed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bridge Time:</span>
                    <span className="font-semibold">{currentSimulation.bridgeTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage:</span>
                    <span className="font-semibold">{currentSimulation.slippage.toFixed(2)}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isRunning && !currentSimulation && results.length === 0 && (
            <div className="bg-card/30 rounded-lg p-8 border border-border text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Configure parameters and run simulation</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          <h4 className="font-semibold mb-4">Summary Statistics</h4>
          
          {results.length > 0 ? (
            <>
              <Card className="bg-card/30 p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Total Profit</span>
                </div>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  ${totalProfit.toFixed(2)}
                </div>
              </Card>

              <Card className="bg-card/30 p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Average Profit</span>
                </div>
                <div className={`text-2xl font-bold ${avgProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  ${avgProfit.toFixed(2)}
                </div>
              </Card>

              <Card className="bg-card/30 p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {successRate.toFixed(1)}%
                </div>
              </Card>

              <Card className="bg-card/30 p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Total Simulations</span>
                </div>
                <div className="text-2xl font-bold">
                  {results.length}
                </div>
              </Card>
            </>
          ) : (
            <div className="bg-card/30 rounded-lg p-8 border border-border text-center text-muted-foreground">
              <p>No simulation results yet</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


