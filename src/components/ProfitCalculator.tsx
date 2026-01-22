import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, Percent, Zap, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function ProfitCalculator() {
  const [tradeAmount, setTradeAmount] = useState(1000);
  const [spread, setSpread] = useState(0.17);
  const [gasFees, setGasFees] = useState(50);
  const [bridgeFees, setBridgeFees] = useState(10);
  const [slippage, setSlippage] = useState(0.1);

  const calculations = useMemo(() => {
    const grossProfit = (tradeAmount * spread) / 100;
    const totalFees = gasFees + bridgeFees + (tradeAmount * slippage) / 100;
    const netProfit = grossProfit - totalFees;
    const roi = (netProfit / tradeAmount) * 100;
    const breakEvenSpread = (totalFees / tradeAmount) * 100;

    return {
      grossProfit,
      totalFees,
      netProfit,
      roi,
      breakEvenSpread,
      isProfitable: netProfit > 0
    };
  }, [tradeAmount, spread, gasFees, bridgeFees, slippage]);

  const [animatedProfit, setAnimatedProfit] = useState(0);

  useEffect(() => {
    const target = calculations.netProfit;
    const duration = 500;
    const steps = 30;
    const increment = (target - animatedProfit) / steps;
    const interval = setInterval(() => {
      setAnimatedProfit(prev => {
        const next = prev + increment;
        if (Math.abs(next - target) < Math.abs(increment)) {
          return target;
        }
        return next;
      });
    }, duration / steps);

    return () => clearInterval(interval);
  }, [calculations.netProfit]);

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">Real-time Profit Calculator</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="tradeAmount">Trade Amount (USDC)</Label>
              <span className="text-sm text-muted-foreground">${tradeAmount.toLocaleString()}</span>
            </div>
            <Slider
              id="tradeAmount"
              min={100}
              max={10000}
              step={100}
              value={[tradeAmount]}
              onValueChange={([value]) => setTradeAmount(value)}
              className="mb-2"
            />
            <Input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(Math.max(100, Math.min(10000, Number(e.target.value))))}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="spread">Arbitrage Spread (%)</Label>
              <span className="text-sm text-muted-foreground">{spread.toFixed(2)}%</span>
            </div>
            <Slider
              id="spread"
              min={0.05}
              max={2}
              step={0.01}
              value={[spread]}
              onValueChange={([value]) => setSpread(value)}
              className="mb-2"
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
              <Label htmlFor="gasFees">Gas Fees (USDC)</Label>
              <span className="text-sm text-muted-foreground">${gasFees}</span>
            </div>
            <Slider
              id="gasFees"
              min={10}
              max={200}
              step={5}
              value={[gasFees]}
              onValueChange={([value]) => setGasFees(value)}
              className="mb-2"
            />
            <Input
              type="number"
              value={gasFees}
              onChange={(e) => setGasFees(Math.max(10, Math.min(200, Number(e.target.value))))}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="bridgeFees">Bridge Fees (USDC)</Label>
              <span className="text-sm text-muted-foreground">${bridgeFees}</span>
            </div>
            <Slider
              id="bridgeFees"
              min={5}
              max={50}
              step={1}
              value={[bridgeFees]}
              onValueChange={([value]) => setBridgeFees(value)}
              className="mb-2"
            />
            <Input
              type="number"
              value={bridgeFees}
              onChange={(e) => setBridgeFees(Math.max(5, Math.min(50, Number(e.target.value))))}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="slippage">Slippage (%)</Label>
              <span className="text-sm text-muted-foreground">{slippage.toFixed(2)}%</span>
            </div>
            <Slider
              id="slippage"
              min={0.05}
              max={1}
              step={0.05}
              value={[slippage]}
              onValueChange={([value]) => setSlippage(value)}
              className="mb-2"
            />
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(Math.max(0.05, Math.min(1, Number(e.target.value))))}
              step="0.05"
              className="mt-2"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <motion.div
            key={calculations.netProfit}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className={`bg-card/30 rounded-xl p-6 border-2 ${
              calculations.isProfitable 
                ? "border-success/50 bg-success/5" 
                : "border-destructive/50 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className={`w-5 h-5 ${calculations.isProfitable ? "text-success" : "text-destructive"}`} />
              <span className="text-sm font-medium text-muted-foreground">Net Profit</span>
            </div>
            <motion.div
              key={animatedProfit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl font-bold ${calculations.isProfitable ? "text-success" : "text-destructive"}`}
            >
              ${animatedProfit.toFixed(2)}
            </motion.div>
            <div className="mt-2 text-sm text-muted-foreground">
              ROI: <span className={calculations.roi > 0 ? "text-success" : "text-destructive"}>
                {calculations.roi > 0 ? "+" : ""}{calculations.roi.toFixed(2)}%
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/30 p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gross Profit</span>
              </div>
              <div className="text-xl font-bold">${calculations.grossProfit.toFixed(2)}</div>
            </Card>

            <Card className="bg-card/30 p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Fees</span>
              </div>
              <div className="text-xl font-bold text-destructive">${calculations.totalFees.toFixed(2)}</div>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20 p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium mb-1">Break-even Spread</div>
                <div className="text-muted-foreground">
                  Minimum spread needed: <span className="font-semibold text-primary">
                    {calculations.breakEvenSpread.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="pt-4">
            <div className="text-sm text-muted-foreground mb-2">Profitability Indicator</div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, Math.max(0, (calculations.netProfit / (tradeAmount * 0.02)) * 100))}%` 
                }}
                className={`h-full ${
                  calculations.isProfitable 
                    ? "bg-gradient-to-r from-success to-success/80" 
                    : "bg-gradient-to-r from-destructive to-destructive/80"
                }`}
              />
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-primary to-primary-dark"
            disabled={!calculations.isProfitable}
          >
            <Zap className="w-4 h-4 mr-2" />
            {calculations.isProfitable ? "Execute Trade" : "Spread Too Low"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

