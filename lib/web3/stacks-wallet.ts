import { AppConfig, showConnect, UserSession } from "@stacks/connect"
import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network"
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  bufferCV,
  noneCV,
  cvToJSON,
  hexToCV,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
  listCV,
  tupleCV,
  stringUtf8CV,
} from "@stacks/transactions"

const appConfig = new AppConfig(["store_write", "publish_data"])
export const userSession = new UserSession({ appConfig })

export interface StacksWalletState {
  address: string | null
  isConnected: boolean
  network: "mainnet" | "testnet"
}

export interface TransactionStatus {
  txId: string
  status: "pending" | "success" | "failed" | "abort_by_response" | "abort_by_post_condition"
  txResult?: any
  blockHeight?: number
  blockHash?: string
  error?: string
}

export interface FeeEstimate {
  estimatedMicroStx: number
  estimatedFeeRate: number
  estimatedTotalFee: number
}

export interface TransactionHistory {
  txId: string
  type: string
  status: TransactionStatus["status"]
  timestamp: number
  blockHeight?: number
  fee?: number
  value?: number
}

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  onRetry?: (attempt: number, error: Error) => void
}

export class StacksWalletService {
  private network: StacksNetwork
  private networkType: "mainnet" | "testnet"
  private transactionHistory: TransactionHistory[] = []
  private apiUrl: string

  constructor(networkType: "mainnet" | "testnet" = "testnet") {
    this.networkType = networkType
    this.network = networkType === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET
    // Get API URL based on network type
    this.apiUrl = networkType === "mainnet" 
      ? "https://api.stacks.co" 
      : "https://api.testnet.hiro.so"
    this.loadTransactionHistory()
  }

  private getApiUrl(): string {
    return this.apiUrl
  }

  /**
   * Load transaction history from localStorage
   */
  private loadTransactionHistory(): void {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(`stacks-tx-history-${this.networkType}`)
      if (stored) {
        this.transactionHistory = JSON.parse(stored)
      }
    } catch (error) {
      console.error("Failed to load transaction history:", error)
    }
  }

  /**
   * Save transaction history to localStorage
   */
  private saveTransactionHistory(): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(
        `stacks-tx-history-${this.networkType}`,
        JSON.stringify(this.transactionHistory.slice(0, 100)), // Keep last 100
      )
    } catch (error) {
      console.error("Failed to save transaction history:", error)
    }
  }

  /**
   * Add transaction to history
   */
  addToHistory(tx: Omit<TransactionHistory, "timestamp">): void {
    this.transactionHistory.unshift({
      ...tx,
      timestamp: Date.now(),
    })
    this.transactionHistory = this.transactionHistory.slice(0, 100)
    this.saveTransactionHistory()
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(limit = 50): TransactionHistory[] {
    return this.transactionHistory.slice(0, limit)
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: any[],
  ): Promise<FeeEstimate> {
    try {
      // Get fee rate from network
      const feeRateResponse = await fetch(`${this.getApiUrl()}/v2/fees/transfer`)
      const feeRateData = await feeRateResponse.json()
      const feeRate = Number.parseInt(feeRateData.fee_rate || "1000", 10)

      // Estimate transaction size (rough estimate)
      const estimatedSize = 200 + functionArgs.length * 50 // Base size + args
      const estimatedMicroStx = estimatedSize * feeRate
      const estimatedTotalFee = estimatedMicroStx / 1_000_000

      return {
        estimatedMicroStx,
        estimatedFeeRate: feeRate,
        estimatedTotalFee,
      }
    } catch (error) {
      console.error("Fee estimation failed:", error)
      // Return default estimate
      return {
        estimatedMicroStx: 1000,
        estimatedFeeRate: 1000,
        estimatedTotalFee: 0.001,
      }
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  private async retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries || 3
    const delayMs = options.delayMs || 1000
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on certain errors
        if (lastError.message.includes("User cancelled") || 
            lastError.message.includes("insufficient funds") ||
            lastError.message.includes("invalid")) {
          throw lastError
        }
        
        if (options.onRetry) {
          options.onRetry(attempt, lastError)
        }

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const jitter = Math.random() * 0.3 * delayMs
          const delay = delayMs * Math.pow(2, attempt - 1) + jitter
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error("Retry failed")
  }

  async connectWallet(): Promise<StacksWalletState> {
    return new Promise((resolve, reject) => {
      showConnect({
        appDetails: {
          name: "Cross-Chain Arbitrage Bot",
          icon: "/logo.png",
        },
        redirectTo: "/",
        onFinish: () => {
          try {
            const userData = userSession.loadUserData()
            const address = this.networkType === "mainnet" 
              ? userData.profile.stxAddress.mainnet 
              : userData.profile.stxAddress.testnet
            
            if (!address) {
              reject(new Error("Failed to get wallet address"))
              return
            }

            resolve({
              address,
              isConnected: true,
              network: this.networkType,
            })
          } catch (error) {
            reject(new Error(`Wallet connection failed: ${error instanceof Error ? error.message : String(error)}`))
          }
        },
        onCancel: () => {
          reject(new Error("User cancelled wallet connection"))
        },
        userSession,
      })
    })
  }

  disconnectWallet(): void {
    userSession.signUserOut()
  }

  getAddress(): string | null {
    if (!userSession.isUserSignedIn()) {
      return null
    }
    try {
      const userData = userSession.loadUserData()
      return this.networkType === "mainnet" 
        ? userData.profile.stxAddress.mainnet 
        : userData.profile.stxAddress.testnet
    } catch (error) {
      console.error("Error getting address:", error)
      return null
    }
  }

  isConnected(): boolean {
    return userSession.isUserSignedIn()
  }

  /**
   * Transfer USDCx tokens using wallet signing
   * Note: This method requires the user to sign the transaction via their wallet
   * For programmatic signing, use a backend service with private key access
   * 
   * IMPORTANT: This method should be used with the Connect library's doContractCall
   * in React components. This class method is provided for compatibility but
   * may not work correctly in all browser environments.
   */
  async transferUSDCx(
    amount: number,
    recipient: string,
    contractAddress: string,
    contractName = "usdcx-token",
    memo?: string,
  ): Promise<string> {
    const address = this.getAddress()
    if (!address) {
      throw new Error("Wallet not connected")
    }

    if (!userSession.isUserSignedIn()) {
      throw new Error("User session not signed in")
    }

    const amountMicro = Math.floor(amount * 1000000) // Convert to 6 decimals

    return await this.retry(
      async () => {
        // Get user data for signing
        const userData = userSession.loadUserData()
        if (!userData || !userData.appPrivateKey) {
          throw new Error("Unable to get app private key from session")
        }

        // Build transaction options for wallet signing
        const txOptions = {
          contractAddress,
          contractName,
          functionName: "transfer",
          functionArgs: [
            uintCV(amountMicro),
            principalCV(address),
            principalCV(recipient),
            memo ? stringUtf8CV(memo) : noneCV(),
          ],
          network: this.network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Deny,
          senderKey: userData.appPrivateKey,
        }

        // Use userSession to sign and broadcast
        const transaction = await makeContractCall(txOptions)
        const broadcastResponse = await broadcastTransaction({ transaction })

        if ("error" in broadcastResponse && broadcastResponse.error) {
          const error = (broadcastResponse as TxBroadcastResultRejected).error
          throw new Error(`Transaction failed: ${error}`)
        }

        const txId = (broadcastResponse as TxBroadcastResultOk).txid
        
        // Add to transaction history
        this.addToHistory({
          txId,
          type: "transfer",
          status: "pending",
        })

        return txId
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Transfer retry attempt ${attempt}:`, error)
        },
      },
    )
  }

  async getUSDCxBalance(contractAddress: string, contractName = "usdcx-token", address?: string): Promise<number> {
    const targetAddress = address || this.getAddress()
    if (!targetAddress) return 0

      try {
        const functionArgs = [principalCV(targetAddress)]
        // Serialize using cvToJSON and hex encoding
        const serializedArgs = functionArgs.map((arg) => {
          const json = cvToJSON(arg)
          return Buffer.from(JSON.stringify(json)).toString("hex")
        })

        const response = await fetch(
          `${this.getApiUrl()}/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: targetAddress,
            arguments: serializedArgs,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.okay || !data.result) {
        throw new Error(`Balance query failed: ${data.error || "Unknown error"}`)
      }

      // Parse hex value and convert from 6 decimals
      const cv = hexToCV(data.result)
      const json = cvToJSON(cv)
      const balanceValue = typeof json.value === "string" 
        ? Number.parseInt(json.value, 16) 
        : Number(json.value)
      
      return balanceValue / 1000000
    } catch (error) {
      console.error("Error fetching USDCx balance:", error)
      return 0
    }
  }

  async initiateWithdrawal(
    amount: number,
    ethereumAddress: string,
    contractAddress: string,
    bridgeContractName = "usdcx-bridge",
  ): Promise<string> {
    const ethereumAddressBuffer = Buffer.from(ethereumAddress.replace("0x", ""), "hex")

    const txOptions = {
      contractAddress,
      contractName: bridgeContractName,
      functionName: "burn-and-withdraw",
      functionArgs: [uintCV(amount * 1000000), bufferCV(ethereumAddressBuffer)],
      senderKey: this.getAddress()!,
      validateWithAbi: true,
      network: this.network,
      anchorMode: AnchorMode.Any,
    }

    const userData = userSession.loadUserData()
    if (!userData || !userData.appPrivateKey) {
      throw new Error("Unable to get app private key from session")
    }

    const transaction = await makeContractCall({
      ...txOptions,
      senderKey: userData.appPrivateKey,
    })
    const broadcastResponse = await broadcastTransaction({ transaction })

    if ("error" in broadcastResponse && broadcastResponse.error) {
      const error = (broadcastResponse as TxBroadcastResultRejected).error
      throw new Error(`Withdrawal failed: ${error}`)
    }

    return (broadcastResponse as TxBroadcastResultOk).txid
  }

  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${this.getApiUrl()}/extended/v1/tx/${txId}`, {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`)
      }

      const data = await response.json()

      const status: TransactionStatus = {
        txId,
        status: data.tx_status as TransactionStatus["status"],
        txResult: data.tx_result,
        blockHeight: data.block_height,
        blockHash: data.block_hash,
      }

      if (data.tx_status === "abort_by_response" || data.tx_status === "abort_by_post_condition") {
        status.status = "failed"
        status.error = data.tx_result?.repr || "Transaction aborted"
      }

      return status
    } catch (error) {
      console.error("Error fetching transaction status:", error)
      
      // Return pending status for network errors (might still be processing)
      if (error instanceof Error && error.name === "AbortError") {
        return {
          txId,
          status: "pending",
          error: "Request timeout - transaction may still be processing",
        }
      }
      
      return {
        txId,
        status: "pending",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Wait for transaction confirmation with progress callback
   */
  async waitForConfirmation(
    txId: string,
    timeoutMs = 300000, // 5 minutes default
    pollIntervalMs = 5000, // 5 seconds
    onProgress?: (status: TransactionStatus) => void,
  ): Promise<TransactionStatus> {
    const startTime = Date.now()
    let lastStatus: TransactionStatus | null = null

    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getTransactionStatus(txId)
        lastStatus = status

        // Call progress callback
        if (onProgress) {
          onProgress(status)
        }

        if (status.status === "success" || status.status === "failed") {
          return status
        }

        // Wait before next poll with exponential backoff for pending transactions
        const elapsed = Date.now() - startTime
        const adaptiveDelay = elapsed > 60000 ? pollIntervalMs * 2 : pollIntervalMs
        await new Promise((resolve) => setTimeout(resolve, adaptiveDelay))
      } catch (error) {
        // If we have a last known status, continue polling
        if (lastStatus) {
          const elapsed = Date.now() - startTime
          if (elapsed < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
            continue
          }
        }
        throw error
      }
    }

    // Return last known status or throw timeout error
    if (lastStatus) {
      return lastStatus
    }

    throw new Error(`Transaction ${txId} confirmation timeout after ${timeoutMs}ms`)
  }

  /**
   * Get network instance
   */
  getNetwork(): StacksNetwork {
    return this.network
  }

  /**
   * Get network type
   */
  getNetworkType(): "mainnet" | "testnet" {
    return this.networkType
  }

  /**
   * Switch network
   */
  switchNetwork(networkType: "mainnet" | "testnet"): void {
    this.networkType = networkType
    this.network = networkType === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET
    this.apiUrl = networkType === "mainnet" 
      ? "https://api.stacks.co" 
      : "https://api.testnet.hiro.so"
  }

  /**
   * Get STX balance
   */
  async getSTXBalance(address?: string): Promise<number> {
    const targetAddress = address || this.getAddress()
    if (!targetAddress) return 0

    try {
      const response = await fetch(`${this.getApiUrl()}/extended/v1/address/${targetAddress}/stx`)
      if (!response.ok) {
        throw new Error(`Failed to fetch STX balance: ${response.statusText}`)
      }
      const data = await response.json()
      return Number.parseInt(data.balance || "0", 10) / 1_000_000
    } catch (error) {
      console.error("Error fetching STX balance:", error)
      return 0
    }
  }

  /**
   * Get account nonce
   */
  async getNonce(address?: string): Promise<number> {
    const targetAddress = address || this.getAddress()
    if (!targetAddress) return 0

    try {
      const response = await fetch(`${this.getApiUrl()}/v2/accounts/${targetAddress}?proof=0`)
      if (!response.ok) {
        throw new Error(`Failed to fetch nonce: ${response.statusText}`)
      }
      const data = await response.json()
      return Number.parseInt(data.nonce || "0", 10)
    } catch (error) {
      console.error("Error fetching nonce:", error)
      return 0
    }
  }

  /**
   * Get recent transactions for an address
   */
  async getRecentTransactions(address?: string, limit = 20): Promise<any[]> {
    const targetAddress = address || this.getAddress()
    if (!targetAddress) return []

    try {
      const response = await fetch(
        `${this.getApiUrl()}/extended/v1/address/${targetAddress}/transactions?limit=${limit}`,
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }
      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
  }

  /**
   * Get USDCx allowance for a spender
   */
  async getUSDCxAllowance(
    contractAddress: string,
    owner: string,
    spender: string,
    contractName = "usdcx-token",
  ): Promise<number> {
    const address = this.getAddress()
    if (!address) return 0

    try {
      const functionArgs = [principalCV(owner), principalCV(spender)]
      const serializedArgs = functionArgs.map((arg) => {
        const json = cvToJSON(arg)
        return Buffer.from(JSON.stringify(json)).toString("hex")
      })

      const response = await fetch(
        `${this.getApiUrl()}/v2/contracts/call-read/${contractAddress}/${contractName}/get-allowance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: address,
            arguments: serializedArgs,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch allowance: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.okay || !data.result) {
        throw new Error(`Allowance query failed: ${data.error || "Unknown error"}`)
      }

      const cv = hexToCV(data.result)
      const json = cvToJSON(cv)
      const allowanceValue = typeof json.value === "string" 
        ? Number.parseInt(json.value, 16) 
        : Number(json.value)

      return allowanceValue / 1000000
    } catch (error) {
      console.error("Error fetching USDCx allowance:", error)
      return 0
    }
  }

  /**
   * Approve USDCx spending using wallet signing
   */
  async approveUSDCx(
    amount: number,
    spender: string,
    contractAddress: string,
    contractName = "usdcx-token",
  ): Promise<string> {
    const address = this.getAddress()
    if (!address) {
      throw new Error("Wallet not connected")
    }

    if (!userSession.isUserSignedIn()) {
      throw new Error("User session not signed in")
    }

    const amountMicro = Math.floor(amount * 1000000)

    return await this.retry(
      async () => {
        const userData = userSession.loadUserData()
        if (!userData || !userData.appPrivateKey) {
          throw new Error("Unable to get app private key from session")
        }

        const txOptions = {
          contractAddress,
          contractName,
          functionName: "approve",
          functionArgs: [principalCV(spender), uintCV(amountMicro)],
          senderKey: userData.appPrivateKey,
          network: this.network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Deny,
        }

        const transaction = await makeContractCall(txOptions)
        const broadcastResponse = await broadcastTransaction({ transaction })

        if ("error" in broadcastResponse && broadcastResponse.error) {
          const error = (broadcastResponse as TxBroadcastResultRejected).error
          throw new Error(`Transaction failed: ${error}`)
        }

        const txId = (broadcastResponse as TxBroadcastResultOk).txid
        
        // Add to transaction history
        this.addToHistory({
          txId,
          type: "approve",
          status: "pending",
        })

        return txId
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Approve retry attempt ${attempt}:`, error)
        },
      },
    )
  }

  /**
   * Batch transfer USDCx to multiple recipients using wallet signing
   */
  async batchTransferUSDCx(
    recipients: Array<{ recipient: string; amount: number }>,
    contractAddress: string,
    contractName = "usdcx-token",
  ): Promise<string> {
    const address = this.getAddress()
    if (!address) {
      throw new Error("Wallet not connected")
    }

    if (!userSession.isUserSignedIn()) {
      throw new Error("User session not signed in")
    }

    if (recipients.length === 0 || recipients.length > 20) {
      throw new Error("Recipients list must have between 1 and 20 entries")
    }

    const recipientList = recipients.map((r) =>
      tupleCV({
        recipient: principalCV(r.recipient),
        amount: uintCV(Math.floor(r.amount * 1000000)),
      }),
    )

    return await this.retry(
      async () => {
        const userData = userSession.loadUserData()
        if (!userData || !userData.appPrivateKey) {
          throw new Error("Unable to get app private key from session")
        }

        const txOptions = {
          contractAddress,
          contractName,
          functionName: "batch-transfer",
          functionArgs: [listCV(recipientList)],
          senderKey: userData.appPrivateKey,
          network: this.network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Deny,
        }

        const transaction = await makeContractCall(txOptions)
        const broadcastResponse = await broadcastTransaction({ transaction })

        if ("error" in broadcastResponse && broadcastResponse.error) {
          const error = (broadcastResponse as TxBroadcastResultRejected).error
          throw new Error(`Transaction failed: ${error}`)
        }

        const txId = (broadcastResponse as TxBroadcastResultOk).txid
        
        // Add to transaction history
        this.addToHistory({
          txId,
          type: "batch-transfer",
          status: "pending",
        })

        return txId
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        onRetry: (attempt, error) => {
          console.warn(`Batch transfer retry attempt ${attempt}:`, error)
        },
      },
    )
  }

  /**
   * Get multiple USDCx balances at once
   */
  async getBatchUSDCxBalances(
    contractAddress: string,
    addresses: string[],
    contractName = "usdcx-token",
  ): Promise<Map<string, number>> {
    const balances = new Map<string, number>()

    const balancePromises = addresses.map(async (address) => {
      try {
        const balance = await this.getUSDCxBalance(contractAddress, contractName, address)
        return { address, balance }
      } catch (error) {
        console.error(`Failed to get balance for ${address}:`, error)
        return { address, balance: 0 }
      }
    })

    const results = await Promise.all(balancePromises)
    results.forEach(({ address, balance }) => {
      balances.set(address, balance)
    })

    return balances
  }
}

// Helper function to create none CV (already imported from @stacks/transactions)

// Singleton instance
let stacksWalletService: StacksWalletService | null = null

export function getStacksWalletService(network: "mainnet" | "testnet" = "testnet"): StacksWalletService {
  if (!stacksWalletService) {
    stacksWalletService = new StacksWalletService(network)
  }
  return stacksWalletService
}
