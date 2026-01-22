import type { PriceData } from "../config/types"

// Demo mode price simulator for testing without real blockchain connections
export class PriceSimulator {
  private basePrices = {
    "USDC/ETH": { ethereum: 0.000512, stacks: 0.000528 },
    "USDC/USDT": { ethereum: 0.9998, stacks: 1.0002 },
    "USDCx/STX": { ethereum: 2.0, stacks: 2.05 },
  }

  generatePriceData(): PriceData[] {
    const prices: PriceData[] = []
    const timestamp = Date.now()

    // Ethereum prices
    prices.push({
      chain: "ethereum",
      dex: "uniswap_v3",
      pair: "USDC/ETH",
      price: this.basePrices["USDC/ETH"].ethereum * (1 + (Math.random() - 0.5) * 0.01),
      liquidity: 1000000 + Math.random() * 500000,
      confidence: 0.95,
      timestamp,
      source: "simulator",
    })

    prices.push({
      chain: "ethereum",
      dex: "curve",
      pair: "USDC/USDT",
      price: this.basePrices["USDC/USDT"].ethereum * (1 + (Math.random() - 0.5) * 0.0005),
      liquidity: 5000000 + Math.random() * 2000000,
      confidence: 0.98,
      timestamp,
      source: "simulator",
    })

    // Stacks prices
    prices.push({
      chain: "stacks",
      dex: "alex",
      pair: "USDCx/STX",
      price: this.basePrices["USDCx/STX"].stacks * (1 + (Math.random() - 0.5) * 0.02),
      liquidity: 500000 + Math.random() * 200000,
      confidence: 0.92,
      timestamp,
      source: "simulator",
    })

    prices.push({
      chain: "stacks",
      dex: "arkadiko",
      pair: "USDC/USDT",
      price: this.basePrices["USDC/USDT"].stacks * (1 + (Math.random() - 0.5) * 0.0008),
      liquidity: 200000 + Math.random() * 100000,
      confidence: 0.9,
      timestamp,
      source: "simulator",
    })

    return prices
  }

  detectOpportunities(prices: PriceData[]): Array<{
    spread: number
    direction: string
    ethPrice: number
    stacksPrice: number
    expectedProfit: number
  }> {
    const opportunities = []

    // Find cross-chain opportunities
    const ethUSDC = prices.find((p) => p.chain === "ethereum" && p.pair.includes("USDC"))
    const stacksUSDC = prices.find((p) => p.chain === "stacks" && p.pair.includes("USDCx"))

    if (ethUSDC && stacksUSDC) {
      const spread = ((stacksUSDC.price - ethUSDC.price) / ethUSDC.price) * 100
      if (Math.abs(spread) > 0.5) {
        opportunities.push({
          spread,
          direction: spread > 0 ? "eth_to_stacks" : "stacks_to_eth",
          ethPrice: ethUSDC.price,
          stacksPrice: stacksUSDC.price,
          expectedProfit: Math.abs(spread) * 50, // Simplified calculation
        })
      }
    }

    return opportunities
  }
}
