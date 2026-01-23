import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity, ZoomIn, ZoomOut } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface DataPoint {
  time: number;
  profit: number;
  trades: number;
  winRate: number;
}

export function InteractivePerformanceChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [zoom, setZoom] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial data
    const generateData = () => {
      const points: DataPoint[] = [];
      const now = Date.now();
      const interval = timeRange === "1h" ? 60000 : timeRange === "24h" ? 3600000 : timeRange === "7d" ? 86400000 : 86400000;
      const count = timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;

      let cumulativeProfit = 0;
      for (let i = count; i >= 0; i--) {
        const profit = (Math.random() - 0.3) * 50;
        cumulativeProfit += profit;
        points.push({
          time: now - (i * interval),
          profit: cumulativeProfit,
          trades: Math.floor(Math.random() * 5) + 1,
          winRate: 85 + Math.random() * 10
        });
      }
      return points;
    };

    setData(generateData());

    // Update data periodically
    const interval = setInterval(() => {
      setData(prev => {
        const newPoint: DataPoint = {
          time: Date.now(),
          profit: prev[prev.length - 1].profit + (Math.random() - 0.3) * 50,
          trades: Math.floor(Math.random() * 5) + 1,
          winRate: 85 + Math.random() * 10
        };
        return [...prev.slice(1), newPoint];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const maxProfit = Math.max(...data.map(d => d.profit), 0);
  const minProfit = Math.min(...data.map(d => d.profit), 0);
  const range = maxProfit - minProfit || 1;

  const getX = (index: number) => {
    return (index / (data.length - 1)) * 100;
  };

  const getY = (profit: number) => {
    return 100 - ((profit - minProfit) / range) * 90;
  };

  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.profit);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  const areaData = `${pathData} L 100 100 L 0 100 Z`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const index = Math.round((x / 100) * (data.length - 1));
    setHoveredPoint(index);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const currentData = hoveredPoint !== null ? data[hoveredPoint] : data[data.length - 1];
  const change = data.length > 1 ? data[data.length - 1].profit - data[0].profit : 0;
  const changePercent = data.length > 1 && data[0].profit !== 0 
    ? (change / Math.abs(data[0].profit)) * 100 
    : 0;

  return (
    <Card className="bg-card/50 border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Interactive Performance Chart</h3>
        </div>
        <div className="flex gap-2">
          {(["1h", "24h", "7d", "30d"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Total Profit</span>
          </div>
          <div className="text-2xl font-bold">
            ${currentData.profit.toFixed(2)}
          </div>
        </div>

        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Change</span>
          </div>
          <div className={`text-2xl font-bold ${change >= 0 ? "text-success" : "text-destructive"}`}>
            {change >= 0 ? "+" : ""}${change.toFixed(2)}
          </div>
          <div className={`text-xs ${changePercent >= 0 ? "text-success" : "text-destructive"}`}>
            {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Total Trades</span>
          </div>
          <div className="text-2xl font-bold">
            {data.reduce((sum, d) => sum + d.trades, 0)}
          </div>
        </div>

        <div className="bg-card/30 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Win Rate</span>
          </div>
          <div className="text-2xl font-bold">
            {currentData.winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-card/30 rounded-lg p-4 border border-border">
        <div
          ref={chartRef}
          className="relative w-full h-64"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
            ))}

            {/* Area fill */}
            <path
              d={areaData}
              fill="url(#gradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
            />

            {/* Hover indicator */}
            {hoveredPoint !== null && (
              <g>
                <line
                  x1={getX(hoveredPoint)}
                  y1="0"
                  x2={getX(hoveredPoint)}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                  className="text-primary"
                />
                <circle
                  cx={getX(hoveredPoint)}
                  cy={getY(data[hoveredPoint].profit)}
                  r="1"
                  fill="currentColor"
                  className="text-primary"
                >
                  <animate
                    attributeName="r"
                    values="1;1.5;1"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bg-card border border-border rounded-lg p-3 shadow-lg pointer-events-none"
              style={{
                left: `${(hoveredPoint / (data.length - 1)) * 100}%`,
                top: "10px",
                transform: "translateX(-50%)"
              }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {new Date(data[hoveredPoint].time).toLocaleString()}
              </div>
              <div className="font-semibold">
                ${data[hoveredPoint].profit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {data[hoveredPoint].trades} trades • {data[hoveredPoint].winRate.toFixed(1)}% win rate
              </div>
            </motion.div>
          )}
        </div>

        {/* Gradient definition */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" className="text-primary" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </Card>
  );
}


