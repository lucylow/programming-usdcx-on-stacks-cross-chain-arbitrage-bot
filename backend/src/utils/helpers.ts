export function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function calculateSlippage(expectedAmount: number, actualAmount: number): number {
  return Math.abs(expectedAmount - actualAmount) / expectedAmount
}

export function calculateROI(profit: number, investment: number): number {
  return investment > 0 ? profit / investment : 0
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function validateStacksAddress(address: string): boolean {
  return /^SP[0-9A-Z]{38,41}$/.test(address) || /^SM[0-9A-Z]{38,41}$/.test(address)
}

export function calculateGasCost(gasUsed: number, gasPrice: number, ethPrice: number): number {
  // Convert gas cost to USD
  const gasCostEth = (gasUsed * gasPrice) / 1e9 // gasPrice in Gwei
  return gasCostEth * ethPrice
}

export function estimateBridgeTime(direction: "eth_to_stacks" | "stacks_to_eth"): number {
  // Return estimated time in milliseconds
  return direction === "eth_to_stacks" ? 15 * 60 * 1000 : 30 * 60 * 1000
}

export function normalizePrice(price: number, decimals: number): number {
  return price / Math.pow(10, decimals)
}

export function calculateMovingAverage(values: number[], period: number): number {
  if (values.length < period) return 0

  const slice = values.slice(-period)
  const sum = slice.reduce((a, b) => a + b, 0)
  return sum / period
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0

  // Calculate returns
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }

  // Calculate standard deviation
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length

  return Math.sqrt(variance)
}

export function isValidTradeSize(size: number, minSize: number, maxSize: number): boolean {
  return size >= minSize && size <= maxSize
}

export function calculateOptimalTradeSize(liquidity: number, maxPositionSize: number, maxSlippage: number): number {
  // Conservative: use 10% of available liquidity
  const liquidityBased = liquidity * 0.1

  // Use minimum of liquidity-based and max position size
  return Math.min(liquidityBased, maxPositionSize)
}
