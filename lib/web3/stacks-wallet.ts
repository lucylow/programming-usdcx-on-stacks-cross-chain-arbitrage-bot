import { AppConfig, showConnect, UserSession } from "@stacks/connect"
import { StacksMainnet, StacksTestnet, StacksNetwork } from "@stacks/network"
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

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  onRetry?: (attempt: number, error: Error) => void
}

export class StacksWalletService {
  private network: StacksMainnet | StacksTestnet
  private networkType: "mainnet" | "testnet"

  constructor(networkType: "mainnet" | "testnet" = "testnet") {
    this.networkType = networkType
    this.network = networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet()
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
        
        if (options.onRetry) {
          options.onRetry(attempt, lastError)
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
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

    const amountMicro = Math.floor(amount * 1000000) // Convert to 6 decimals

    return await this.retry(
      async () => {
        const txOptions = {
          contractAddress,
          contractName,
          functionName: "transfer",
          functionArgs: [
            uintCV(amountMicro),
            principalCV(address),
            principalCV(recipient),
            memo ? { type: 10, value: { type: 2, data: memo } } as any : noneCV(),
          ],
          senderKey: address, // This should be the private key in production
          network: this.network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Deny,
        }

        const transaction = await makeContractCall(txOptions)
        const broadcastResponse = await broadcastTransaction(transaction, this.network)

        if (broadcastResponse.error) {
          const error = (broadcastResponse as TxBroadcastResultRejected).error
          throw new Error(`Transaction failed: ${error}`)
        }

        return (broadcastResponse as TxBroadcastResultOk).txid
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
      const serializedArgs = functionArgs.map((arg) => arg.serialize().toString("hex"))

      const response = await fetch(
        `${this.network.coreApiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
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

    const transaction = await makeContractCall(txOptions)
    const broadcastResponse = await broadcastTransaction(transaction, this.network)

    if (broadcastResponse.error) {
      throw new Error(`Withdrawal failed: ${broadcastResponse.error}`)
    }

    return broadcastResponse.txid
  }

  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.network.coreApiUrl}/extended/v1/tx/${txId}`)
      
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
      return {
        txId,
        status: "pending",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txId: string,
    timeoutMs = 300000, // 5 minutes default
    pollIntervalMs = 5000, // 5 seconds
  ): Promise<TransactionStatus> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getTransactionStatus(txId)

      if (status.status === "success" || status.status === "failed") {
        return status
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
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
