import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { InteractiveTradeFlow } from "@/components/InteractiveTradeFlow";
import { ProfitCalculator } from "@/components/ProfitCalculator";
import { RiskAssessmentDashboard } from "@/components/RiskAssessmentDashboard";
import { ChainBridgeAnimation } from "@/components/ChainBridgeAnimation";
import { InteractivePerformanceChart } from "@/components/InteractivePerformanceChart";
import { TradeSimulator } from "@/components/TradeSimulator";
import Navigation from "@/components/layout/Navigation";
import { 
  Zap, Calculator, Shield, Cable, TrendingUp, Settings,
  Sparkles
} from "lucide-react";

export default function InteractiveDemoPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Interactive Demo Center</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Explore our comprehensive suite of interactive tools and visualizations. 
              Experience real-time arbitrage trading, risk assessment, and performance analytics.
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-card/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Trade Flow</span>
              </TabsTrigger>
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="bridge" className="flex items-center gap-2">
                <Cable className="w-4 h-4" />
                <span className="hidden sm:inline">Bridge</span>
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Chart</span>
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Simulator</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <InteractiveDemo />
            </TabsContent>

            <TabsContent value="flow" className="mt-8">
              <InteractiveTradeFlow />
            </TabsContent>

            <TabsContent value="calculator" className="mt-8">
              <ProfitCalculator />
            </TabsContent>

            <TabsContent value="risk" className="mt-8">
              <RiskAssessmentDashboard />
            </TabsContent>

            <TabsContent value="bridge" className="mt-8">
              <ChainBridgeAnimation />
            </TabsContent>

            <TabsContent value="chart" className="mt-8">
              <InteractivePerformanceChart />
            </TabsContent>

            <TabsContent value="simulator" className="mt-8">
              <TradeSimulator />
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card/50 rounded-lg p-6 border border-border hover:border-primary/50 transition-colors">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Live Trading Demo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Experience real-time arbitrage detection and execution
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="text-sm text-primary hover:underline"
              >
                View Demo →
              </button>
            </div>

            <div className="bg-card/50 rounded-lg p-6 border border-border hover:border-primary/50 transition-colors">
              <Calculator className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Profit Calculator</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Calculate potential profits with real-time parameters
              </p>
              <button
                onClick={() => setActiveTab("calculator")}
                className="text-sm text-primary hover:underline"
              >
                Open Calculator →
              </button>
            </div>

            <div className="bg-card/50 rounded-lg p-6 border border-border hover:border-primary/50 transition-colors">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Risk Assessment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor real-time risk factors and trade safety
              </p>
              <button
                onClick={() => setActiveTab("risk")}
                className="text-sm text-primary hover:underline"
              >
                View Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


