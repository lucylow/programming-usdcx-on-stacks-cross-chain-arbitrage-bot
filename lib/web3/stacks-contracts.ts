// Stacks contract interaction utilities for all smart contracts
import {
  makeContractCall,
  broadcastTransaction,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  bufferCV,
  listCV,
  PostConditionMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  AnchorMode,
  cvToJSON,
  hexToCV,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
  ClarityValue,
} from "@stacks/transactions"
import { StacksMainnet, StacksTestnet, StacksNetwork } from "@stacks/network"

// Contract addresses - update these after deployment
const CONTRACT_ADDRESSES = {
  mainnet: {
    daoGovernance: "SP...",
    governanceToken: "SP...",
    nftMarketplace: "SP...",
    usdcxToken: "SP...",
    usdcxBridge: "SP...",
    arbitrageVault: "SP...",
  },
  testnet: {
    daoGovernance: "ST...",
    governanceToken: "ST...",
    nftMarketplace: "ST...",
    usdcxToken: "ST...",
    usdcxBridge: "ST...",
    arbitrageVault: "ST...",
  },
}

type NetworkType = "mainnet" | "testnet"

export interface ReadOnlyCallOptions {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  senderAddress: string
}

export interface TransactionStatus {
  txId: string
  status: "pending" | "success" | "failed" | "abort_by_response" | "abort_by_post_condition"
  txResult?: any
  blockHeight?: number
  blockHash?: string
  error?: string
}

export class StacksContractService {
  private network: StacksMainnet | StacksTestnet
  private networkType: NetworkType
  private addresses: typeof CONTRACT_ADDRESSES.mainnet

  constructor(networkType: NetworkType = "testnet") {
    this.networkType = networkType
    this.network = networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet()
    this.addresses = CONTRACT_ADDRESSES[networkType]
  }

  /**
   * Make a read-only contract call
   */
  async readOnlyCall<T = any>(options: ReadOnlyCallOptions): Promise<T> {
    try {
      const functionArgs = options.functionArgs.map((arg) => {
        return arg.serialize().toString("hex")
      })

      const response = await fetch(
        `${this.network.coreApiUrl}/v2/contracts/call-read/${options.contractAddress}/${options.contractName}/${options.functionName}`,
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
        const cv = hexToCV(data.result)
        const json = cvToJSON(cv)
        return json.value as T
      }

      throw new Error(`Read-only call returned error: ${data.error || "Unknown error"}`)
    } catch (error: any) {
      console.error("Read-only call failed:", error)
      throw new Error(`Stacks read-only call failed: ${error.message}`)
    }
  }

  /**
   * Get transaction status
   */
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
    } catch (error: any) {
      console.error(`Failed to get transaction status for ${txId}:`, error)
      return {
        txId,
        status: "pending",
        error: error.message,
      }
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txId: string,
    timeoutMs = 300000, // 5 minutes
    pollIntervalMs = 5000, // 5 seconds
  ): Promise<TransactionStatus> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getTransactionStatus(txId)

      if (status.status === "success" || status.status === "failed") {
        return status
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    throw new Error(`Transaction ${txId} confirmation timeout after ${timeoutMs}ms`)
  }

  /**
   * Broadcast transaction with retry logic
   */
  private async broadcastWithRetry(
    transaction: any,
    maxRetries = 3,
  ): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const broadcastResponse = await broadcastTransaction(transaction, this.network)

        if (broadcastResponse.error) {
          const error = (broadcastResponse as TxBroadcastResultRejected).error
          throw new Error(`Transaction broadcast failed: ${error}`)
        }

        return (broadcastResponse as TxBroadcastResultOk).txid
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError || new Error("Transaction broadcast failed")
  }

  // ================ DAO GOVERNANCE ================
  async createProposal(
    senderKey: string,
    title: string,
    description: string,
    targetContract: string,
    functionName: string,
    calldata: Buffer[],
  ) {
    const txOptions = {
      contractAddress: this.addresses.daoGovernance.split(".")[0],
      contractName: "dao-governance",
      functionName: "create-proposal",
      functionArgs: [
        stringAsciiCV(title),
        stringUtf8CV(description),
        principalCV(targetContract),
        stringAsciiCV(functionName),
        listCV(calldata.map((b) => bufferCV(b))),
      ],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async voteOnProposal(
    senderKey: string,
    proposalId: number,
    support: "for" | "against" | "abstain",
    votingPower: number,
  ) {
    const supportBuff =
      support === "for" ? Buffer.from([0x01]) : support === "against" ? Buffer.from([0x00]) : Buffer.from([0x02])

    const txOptions = {
      contractAddress: this.addresses.daoGovernance.split(".")[0],
      contractName: "dao-governance",
      functionName: "vote-on-proposal",
      functionArgs: [uintCV(proposalId), bufferCV(supportBuff), uintCV(votingPower)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async executeProposal(senderKey: string, proposalId: number) {
    const txOptions = {
      contractAddress: this.addresses.daoGovernance.split(".")[0],
      contractName: "dao-governance",
      functionName: "execute-proposal",
      functionArgs: [uintCV(proposalId)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  // ================ GOVERNANCE TOKEN ================
  async delegateVotes(senderKey: string, delegatee: string) {
    const txOptions = {
      contractAddress: this.addresses.governanceToken.split(".")[0],
      contractName: "governance-token",
      functionName: "delegate-votes",
      functionArgs: [principalCV(delegatee)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async transferTokens(senderKey: string, senderAddress: string, recipient: string, amount: number) {
    const txOptions = {
      contractAddress: this.addresses.governanceToken.split(".")[0],
      contractName: "governance-token",
      functionName: "transfer",
      functionArgs: [uintCV(amount), principalCV(senderAddress), principalCV(recipient)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  // ================ NFT MARKETPLACE ================
  async mintNFT(senderKey: string, name: string, uri: string, royaltyPercent: number) {
    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "mint-nft",
      functionArgs: [stringAsciiCV(name), stringAsciiCV(uri), uintCV(royaltyPercent)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async listNFT(senderKey: string, nftId: number, price: number) {
    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "list-nft",
      functionArgs: [uintCV(nftId), uintCV(price)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async buyNFT(senderKey: string, senderAddress: string, listingId: number, price: number) {
    const postConditions = [makeStandardSTXPostCondition(senderAddress, FungibleConditionCode.LessEqual, price)]

    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "buy-nft",
      functionArgs: [uintCV(listingId)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async createAuction(senderKey: string, nftId: number, startPrice: number, reservePrice: number, duration: number) {
    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "create-auction",
      functionArgs: [uintCV(nftId), uintCV(startPrice), uintCV(reservePrice), uintCV(duration)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async placeBid(senderKey: string, senderAddress: string, auctionId: number, bidAmount: number) {
    const postConditions = [makeStandardSTXPostCondition(senderAddress, FungibleConditionCode.Equal, bidAmount)]

    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "place-bid",
      functionArgs: [uintCV(auctionId), uintCV(bidAmount)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async settleAuction(senderKey: string, auctionId: number) {
    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "settle-auction",
      functionArgs: [uintCV(auctionId)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async makeOffer(senderKey: string, senderAddress: string, nftId: number, amount: number, expiryBlocks: number) {
    const postConditions = [makeStandardSTXPostCondition(senderAddress, FungibleConditionCode.Equal, amount)]

    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "make-offer",
      functionArgs: [uintCV(nftId), uintCV(amount), uintCV(expiryBlocks)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  async acceptOffer(senderKey: string, nftId: number, offerer: string) {
    const txOptions = {
      contractAddress: this.addresses.nftMarketplace.split(".")[0],
      contractName: "nft-marketplace",
      functionName: "accept-offer",
      functionArgs: [uintCV(nftId), principalCV(offerer)],
      senderKey,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
    }

    const transaction = await makeContractCall(txOptions)
    const txId = await this.broadcastWithRetry(transaction)
    return { txid: txId } as any
  }

  // ================ ARBITRAGE VAULT ================
  async getVaultStats(senderAddress: string) {
    return await this.readOnlyCall<{
      balance: { value: string }
      "total-profit": { value: string }
      "total-trades": { value: string }
      paused: { value: boolean }
    }>({
      contractAddress: this.addresses.arbitrageVault.split(".")[0],
      contractName: "arbitrage-vault",
      functionName: "get-vault-stats",
      functionArgs: [],
      senderAddress,
    })
  }

  async getTradeHistory(senderAddress: string, tradeId: number) {
    return await this.readOnlyCall({
      contractAddress: this.addresses.arbitrageVault.split(".")[0],
      contractName: "arbitrage-vault",
      functionName: "get-trade",
      functionArgs: [uintCV(tradeId)],
      senderAddress,
    })
  }

  // ================ USDCX TOKEN ================
  async getUSDCxBalance(senderAddress: string, address: string) {
    return await this.readOnlyCall<{ value: string }>({
      contractAddress: this.addresses.usdcxToken.split(".")[0],
      contractName: "usdcx-token",
      functionName: "get-balance",
      functionArgs: [principalCV(address)],
      senderAddress,
    })
  }

  // ================ READ FUNCTIONS ================
  getContractAddresses() {
    return this.addresses
  }

  getNetwork(): StacksNetwork {
    return this.network
  }

  getNetworkType(): NetworkType {
    return this.networkType
  }
}

export const stacksContracts = new StacksContractService(
  ((import.meta.env.VITE_STACKS_NETWORK || import.meta.env.NEXT_PUBLIC_STACKS_NETWORK) as NetworkType) || "testnet",
)
