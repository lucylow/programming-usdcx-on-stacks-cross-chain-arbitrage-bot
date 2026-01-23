import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  type PostCondition,
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  noneCV,
  someCV,
  listCV,
  tupleCV,
  ClarityValue,
  TransactionVersion,
  getAddressFromPrivateKey,
  createStacksPrivateKey,
  privateKeyToString,
  TxBroadcastResultOk,
  cvToJSON,
  hexToCV,
} from "@stacks/transactions"
import { StacksMainnet, StacksTestnet, StacksNetwork } from "@stacks/network"
import { logger } from "../utils/logger"
import { retry } from "../utils/retry"
import { BlockchainError, getErrorMessage } from "../utils/errors"
import type { NetworkConfig } from "../config/types"

export interface StacksTransactionOptions {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  senderKey: string
  fee?: number
  nonce?: number
  anchorMode?: AnchorMode
  postConditionMode?: PostConditionMode
  postConditions?: PostCondition[]
  network?: StacksNetwork
}

export interface StacksReadOnlyCallOptions {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  senderAddress: string
  network?: StacksNetwork
}

export interface TransactionStatus {
  txId: string
  status: "pending" | "success" | "failed" | "abort_by_response" | "abort_by_post_condition"
  txResult?: unknown
  blockHeight?: number
  blockHash?: string
  error?: string
}

export interface GasEstimate {
  estimatedCost: number
  estimatedMicroStx: number
  estimatedFeeRate: number
}

export class StacksClient {
  private network: StacksNetwork
  private networkType: "mainnet" | "testnet"
  private privateKey: string
  private address: string
  private apiUrl: string

  constructor(config: NetworkConfig) {
    this.networkType = (config.network as "mainnet" | "testnet") || "testnet"
    this.network = this.networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet()
    this.privateKey = config.privateKey
    this.apiUrl = config.rpcUrl || this.network.coreApiUrl

    // Derive address from private key
    try {
      const stacksPrivateKey = createStacksPrivateKey(this.privateKey)
      // Convert StacksPrivateKey to string for getAddressFromPrivateKey
      const privateKeyString = privateKeyToString(stacksPrivateKey)
      this.address = getAddressFromPrivateKey(privateKeyString, this.networkType === "mainnet" ? TransactionVersion.Mainnet : TransactionVersion.Testnet)
      logger.info(`Stacks client initialized for ${this.networkType} at address: ${this.address}`)
    } catch (error) {
      logger.error("Failed to initialize Stacks client:", error)
      throw new BlockchainError(
        `Invalid Stacks private key: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  private nonceCache: { nonce: number; timestamp: number } | null = null
  private readonly NONCE_CACHE_TTL = 5000 // 5 seconds

  /**
   * Get the current nonce for the account with caching
   */
  async getNonce(forceRefresh = false): Promise<number> {
    // Use cached nonce if still valid
    if (!forceRefresh && this.nonceCache) {
      const age = Date.now() - this.nonceCache.timestamp
      if (age < this.NONCE_CACHE_TTL) {
        return this.nonceCache.nonce
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/v2/accounts/${this.address}?proof=0`)
      if (!response.ok) {
        throw new Error(`Failed to fetch nonce: ${response.statusText}`)
      }
      const data = await response.json()
      const nonce = data.nonce || 0
      
      // Cache the nonce
      this.nonceCache = { nonce, timestamp: Date.now() }
      
      return nonce
    } catch (error) {
      logger.error("Failed to get nonce:", error)
      // Return cached nonce if available, otherwise 0
      return this.nonceCache?.nonce || 0
    }
  }

  /**
   * Increment nonce cache (call after successful transaction)
   */
  private incrementNonceCache(): void {
    if (this.nonceCache) {
      this.nonceCache.nonce++
      this.nonceCache.timestamp = Date.now()
    }
  }

  private balanceCache: { balance: number; timestamp: number } | null = null
  private readonly BALANCE_CACHE_TTL = 10000 // 10 seconds

  /**
   * Get account balance in STX with caching
   */
  async getBalance(forceRefresh = false): Promise<number> {
    // Use cached balance if still valid
    if (!forceRefresh && this.balanceCache) {
      const age = Date.now() - this.balanceCache.timestamp
      if (age < this.BALANCE_CACHE_TTL) {
        return this.balanceCache.balance
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/v2/accounts/${this.address}?proof=0`)
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }
      const data = await response.json()
      const balance = Number.parseInt(data.balance, 16) / 1e6 // Convert from microSTX to STX
      
      // Cache the balance
      this.balanceCache = { balance, timestamp: Date.now() }
      
      return balance
    } catch (error) {
      logger.error("Failed to get balance:", error)
      // Return cached balance if available, otherwise 0
      return this.balanceCache?.balance || 0
    }
  }

  /**
   * Get current fee rate from network
   */
  private async getFeeRate(): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/v2/fees/transfer`)
      if (!response.ok) {
        throw new Error(`Failed to fetch fee rate: ${response.statusText}`)
      }
      const data = await response.json()
      return Number.parseInt(data.fee_rate || "1000", 10)
    } catch (error) {
      logger.warn("Failed to fetch fee rate, using default:", error)
      return 1000 // Default fee rate
    }
  }

  /**
   * Estimate gas for a contract call with improved accuracy
   */
  async estimateGas(options: Omit<StacksTransactionOptions, "senderKey" | "nonce">): Promise<GasEstimate> {
    try {
      const feeRate = await this.getFeeRate()
      const nonce = await this.getNonce()
      const { postConditions, ...rest } = options
      
      // Build transaction to estimate size
      const transaction = await makeContractCall({
        ...rest,
        postConditions: (postConditions ?? []) as PostCondition[],
        senderKey: this.privateKey,
        nonce,
        network: this.network,
        anchorMode: options.anchorMode || AnchorMode.Any,
        postConditionMode: options.postConditionMode || PostConditionMode.Deny,
      })

      // Estimate transaction size more accurately
      // Base size: ~200 bytes, each function arg: ~50-100 bytes, post conditions: ~100 bytes each
      const baseSize = 200
      const argsSize = options.functionArgs.length * 75
      const postConditionsSize = (postConditions?.length || 0) * 100
      const estimatedSize = baseSize + argsSize + postConditionsSize
      
      // Calculate fee based on size and fee rate
      const estimatedMicroStx = estimatedSize * feeRate
      const estimatedCost = estimatedMicroStx / 1e6

      // Add 20% buffer for safety
      const bufferedMicroStx = Math.ceil(estimatedMicroStx * 1.2)
      const bufferedCost = bufferedMicroStx / 1e6

      return {
        estimatedCost: bufferedCost,
        estimatedMicroStx: bufferedMicroStx,
        estimatedFeeRate: feeRate,
      }
    } catch (error: unknown) {
      logger.error("Gas estimation failed:", error)
      // Return conservative estimate with higher buffer
      return {
        estimatedCost: 0.002, // 0.002 STX (conservative)
        estimatedMicroStx: 2000,
        estimatedFeeRate: 1000,
      }
    }
  }

  /**
   * Make a contract call (write operation)
   */
  async contractCall(options: StacksTransactionOptions): Promise<string> {
    const nonce = options.nonce ?? (await this.getNonce())

    try {
      logger.info(`Making contract call: ${options.contractName}.${options.functionName}`)

      const transaction = await makeContractCall({
        contractAddress: options.contractAddress,
        contractName: options.contractName,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        senderKey: options.senderKey,
        nonce,
        network: options.network || this.network,
        anchorMode: options.anchorMode || AnchorMode.Any,
        postConditionMode: options.postConditionMode || PostConditionMode.Deny,
        postConditions: (options.postConditions ?? []) as PostCondition[],
        fee: options.fee,
      })

      const broadcastResult = await retry(
        async () => {
          return await broadcastTransaction(transaction, options.network || this.network)
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            logger.warn(`Broadcast attempt ${attempt} failed:`, error)
          },
        },
      )

      if (broadcastResult.error) {
        throw new Error(`Transaction broadcast failed: ${broadcastResult.error}`)
      }

      const txId = (broadcastResult as TxBroadcastResultOk).txid
      logger.info(`Transaction broadcasted: ${txId}`)

      return txId
    } catch (error: unknown) {
      logger.error("Contract call failed:", error)
      throw new Error(`Stacks contract call failed: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Make a read-only contract call
   */
  async readOnlyCall<T = unknown>(options: StacksReadOnlyCallOptions): Promise<T> {
    try {
      // Convert Clarity values to hex for API call
      // The Stacks API expects hex-encoded Clarity values
      const functionArgs = options.functionArgs.map((arg) => {
        // Use type assertion to access internal serialize method if available
        // Otherwise, convert via JSON as fallback
        const cvAny = arg as { serialize?: () => Uint8Array }
        if (cvAny && typeof cvAny.serialize === 'function') {
          try {
            const serialized = cvAny.serialize()
            if (serialized instanceof Uint8Array) {
              return Buffer.from(serialized).toString("hex")
            }
            if (typeof serialized === 'string') {
              return serialized
            }
          } catch {
            // Fall through to JSON fallback
          }
        }
        // Fallback: convert ClarityValue to JSON and encode as hex
        // This is not ideal but will work for basic types
        const jsonValue = cvToJSON(arg)
        return Buffer.from(JSON.stringify(jsonValue)).toString("hex")
      })

      const response = await fetch(
        `${this.apiUrl}/v2/contracts/call-read/${options.contractAddress}/${options.contractName}/${options.functionName}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: options.senderAddress,
            arguments: functionArgs,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Read-only call failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.okay && data.result) {
        // Parse the result
        const cv = hexToCV(data.result)
        const json = cvToJSON(cv)
        return json.value as T
      }

      throw new Error(`Read-only call returned error: ${data.error || "Unknown error"}`)
    } catch (error) {
      logger.error("Read-only call failed:", error)
      if (error instanceof BlockchainError) throw error
      throw new BlockchainError(
        `Stacks read-only call failed: ${getErrorMessage(error)}`,
        "stacks",
        { contract: `${options.contractName}.${options.functionName}`, cause: error },
      )
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
      try {
        const status = await this.getTransactionStatus(txId)

        if (status.status === "success" || status.status === "failed") {
          return status
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      } catch (error) {
        logger.warn(`Error checking transaction status: ${error}`)
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      }
    }

    throw new Error(`Transaction ${txId} confirmation timeout after ${timeoutMs}ms`)
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/extended/v1/tx/${txId}`)
      
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
    } catch (error: unknown) {
      logger.error(`Failed to get transaction status for ${txId}:`, error)
      return {
        txId,
        status: "pending",
        error: getErrorMessage(error),
      }
    }
  }

  /**
   * Transfer USDCx tokens
   */
  async transferUSDCx(
    amount: number,
    recipient: string,
    contractAddress: string,
    contractName = "usdcx-token",
    memo?: string,
  ): Promise<string> {
    const amountMicro = Math.floor(amount * 1e6) // USDCx has 6 decimals

    const functionArgs = [
      uintCV(amountMicro),
      principalCV(this.address),
      principalCV(recipient),
      memo ? someCV(stringUtf8CV(memo)) : noneCV(),
    ]

    return await this.contractCall({
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs,
      senderKey: this.privateKey,
    })
  }

  /**
   * Get USDCx balance
   */
  async getUSDCxBalance(contractAddress: string, contractName = "usdcx-token", address?: string): Promise<number> {
    const targetAddress = address || this.address

    try {
      const balance = await this.readOnlyCall<{ value: string }>({
        contractAddress,
        contractName,
        functionName: "get-balance",
        functionArgs: [principalCV(targetAddress)],
        senderAddress: targetAddress,
      })

      // Parse hex value and convert from 6 decimals
      const balanceValue = Number.parseInt(balance.value, 16)
      return balanceValue / 1e6
    } catch (error) {
      logger.error("Failed to get USDCx balance:", error)
      return 0
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
    try {
      const allowance = await this.readOnlyCall<{ value: string }>({
        contractAddress,
        contractName,
        functionName: "get-allowance",
        functionArgs: [principalCV(owner), principalCV(spender)],
        senderAddress: owner,
      })

      const allowanceValue = Number.parseInt(allowance.value, 16)
      return allowanceValue / 1e6
    } catch (error) {
      logger.error("Failed to get USDCx allowance:", error)
      return 0
    }
  }

  /**
   * Approve USDCx spending
   */
  async approveUSDCx(
    contractAddress: string,
    spender: string,
    amount: number,
    contractName = "usdcx-token",
  ): Promise<string> {
    const amountMicro = Math.floor(amount * 1e6)

    return await this.contractCall({
      contractAddress,
      contractName,
      functionName: "approve",
      functionArgs: [principalCV(spender), uintCV(amountMicro)],
      senderKey: this.privateKey,
    })
  }

  /**
   * Transfer USDCx from another address (requires allowance)
   */
  async transferUSDCxFrom(
    contractAddress: string,
    sender: string,
    recipient: string,
    amount: number,
    contractName = "usdcx-token",
    memo?: string,
  ): Promise<string> {
    const amountMicro = Math.floor(amount * 1e6)

    const functionArgs = [
      uintCV(amountMicro),
      principalCV(sender),
      principalCV(recipient),
      memo ? someCV(stringUtf8CV(memo)) : noneCV(),
    ]

    return await this.contractCall({
      contractAddress,
      contractName,
      functionName: "transfer-from",
      functionArgs,
      senderKey: this.privateKey,
    })
  }

  /**
   * Batch transfer USDCx to multiple recipients
   */
  async batchTransferUSDCx(
    contractAddress: string,
    recipients: Array<{ recipient: string; amount: number }>,
    contractName = "usdcx-token",
  ): Promise<string> {
    const recipientList = recipients.map((r) =>
      tupleCV({
        recipient: principalCV(r.recipient),
        amount: uintCV(Math.floor(r.amount * 1e6)),
      }),
    )

    return await this.contractCall({
      contractAddress,
      contractName,
      functionName: "batch-transfer",
      functionArgs: [listCV(recipientList)],
      senderKey: this.privateKey,
    })
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

    // Fetch balances in parallel
    const balancePromises = addresses.map(async (address) => {
      try {
        const balance = await this.getUSDCxBalance(contractAddress, contractName, address)
        return { address, balance }
      } catch (error) {
        logger.error(`Failed to get balance for ${address}:`, error)
        return { address, balance: 0 }
      }
    })

    const results = await Promise.all(balancePromises)
    results.forEach(({ address, balance }) => {
      balances.set(address, balance)
    })

    return balances
  }

  /**
   * Call arbitrage vault deposit (pull-based: vault transfers USDCx from caller in one tx).
   * Caller must have sufficient USDCx balance. No prior approval needed.
   */
  async depositToVault(
    amount: number,
    vaultContractAddress: string,
    vaultContractName = "arbitrage-vault",
    _usdcxContractAddress?: string,
    _usdcxContractName?: string,
  ): Promise<string> {
    const amountMicro = Math.floor(amount * 1e6)

    return await this.contractCall({
      contractAddress: vaultContractAddress,
      contractName: vaultContractName,
      functionName: "deposit",
      functionArgs: [uintCV(amountMicro)],
      senderKey: this.privateKey,
    })
  }

  /**
   * Execute arbitrage on Stacks
   */
  async executeArbitrage(
    dexName: string,
    amountIn: number,
    minAmountOut: number,
    expectedProfit: number,
    vaultContractAddress: string,
    vaultContractName = "arbitrage-vault",
  ): Promise<string> {
    const amountInMicro = Math.floor(amountIn * 1e6)
    const minAmountOutMicro = Math.floor(minAmountOut * 1e6)
    const expectedProfitMicro = Math.floor(expectedProfit * 1e6)

    return await this.contractCall({
      contractAddress: vaultContractAddress,
      contractName: vaultContractName,
      functionName: "execute-arbitrage",
      functionArgs: [
        stringAsciiCV(dexName),
        uintCV(amountInMicro),
        uintCV(minAmountOutMicro),
        uintCV(expectedProfitMicro),
      ],
      senderKey: this.privateKey,
    })
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(
    vaultContractAddress: string,
    vaultContractName = "arbitrage-vault",
  ): Promise<{
    balance: number
    totalProfit: number
    totalTrades: number
    paused: boolean
  }> {
    try {
      const stats = await this.readOnlyCall<{
        balance: { value: string }
        "total-profit": { value: string }
        "total-trades": { value: string }
        paused: { value: boolean }
      }>({
        contractAddress: vaultContractAddress,
        contractName: vaultContractName,
        functionName: "get-vault-stats",
        functionArgs: [],
        senderAddress: this.address,
      })

      return {
        balance: Number.parseInt(stats.balance.value, 16) / 1e6,
        totalProfit: Number.parseInt(stats["total-profit"].value, 16) / 1e6,
        totalTrades: Number.parseInt(stats["total-trades"].value, 16),
        paused: stats.paused.value,
      }
    } catch (error) {
      logger.error("Failed to get vault stats:", error)
      throw error
    }
  }

  /**
   * Get network instance
   */
  getNetwork(): StacksNetwork {
    return this.network
  }

  /**
   * Get address
   */
  getAddress(): string {
    return this.address
  }

  /**
   * Get network type
   */
  getNetworkType(): "mainnet" | "testnet" {
    return this.networkType
  }

  /**
   * Get private key (for internal use by DEX integrations)
   */
  getPrivateKey(): string {
    return this.privateKey
  }

  /**
   * Batch execute multiple contract calls sequentially
   * Useful for multi-step operations that must execute in order
   */
  async batchContractCalls(
    calls: Array<Omit<StacksTransactionOptions, "senderKey" | "nonce">>,
    options?: {
      waitForConfirmations?: boolean
      confirmationTimeout?: number
    },
  ): Promise<Array<{ txId: string; status: TransactionStatus }>> {
    const results: Array<{ txId: string; status: TransactionStatus }> = []
    let currentNonce = await this.getNonce()

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i]
      try {
        logger.info(`Batch call ${i + 1}/${calls.length}: ${call.contractName}.${call.functionName}`)

        const txId = await this.contractCall({
          ...call,
          senderKey: this.privateKey,
          nonce: currentNonce++,
        })

        let status: TransactionStatus
        if (options?.waitForConfirmations) {
          status = await this.waitForConfirmation(
            txId,
            options.confirmationTimeout || 300000,
          )
        } else {
          status = await this.getTransactionStatus(txId)
        }

        results.push({ txId, status })

        // If transaction failed, stop batch execution
        if (status.status === "failed") {
          logger.error(`Batch call ${i + 1} failed, stopping batch execution`)
          break
        }
      } catch (error) {
        logger.error(`Batch call ${i + 1} failed:`, error)
        // Add failed result and continue or break based on requirements
        results.push({
          txId: "",
          status: {
            txId: "",
            status: "failed",
            error: getErrorMessage(error),
          },
        })
        // Break on error to prevent invalid state
        break
      }
    }

    return results
  }

  /**
   * Check if account has sufficient STX balance for transaction
   */
  async hasSufficientBalance(requiredStx: number): Promise<boolean> {
    const balance = await this.getBalance()
    return balance >= requiredStx
  }

  /**
   * Validate transaction before execution
   */
  async validateTransaction(options: StacksTransactionOptions): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check balance
    const gasEstimate = await this.estimateGas({
      contractAddress: options.contractAddress,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      anchorMode: options.anchorMode,
      postConditionMode: options.postConditionMode,
      postConditions: options.postConditions,
    })

    const balance = await this.getBalance()
    if (balance < gasEstimate.estimatedCost) {
      errors.push(`Insufficient STX balance: ${balance} < ${gasEstimate.estimatedCost}`)
    } else if (balance < gasEstimate.estimatedCost * 2) {
      warnings.push(`Low STX balance: ${balance} (recommended: ${gasEstimate.estimatedCost * 2})`)
    }

    // Validate nonce
    const nonce = await this.getNonce()
    if (options.nonce !== undefined && options.nonce < nonce) {
      errors.push(`Nonce too low: ${options.nonce} < ${nonce}`)
    }

    // Validate contract address format
    if (!options.contractAddress.startsWith("SP") && !options.contractAddress.startsWith("ST")) {
      errors.push(`Invalid contract address format: ${options.contractAddress}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
