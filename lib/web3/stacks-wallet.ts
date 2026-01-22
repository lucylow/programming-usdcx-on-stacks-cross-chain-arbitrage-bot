import { AppConfig, showConnect, UserSession } from "@stacks/connect"
import { StacksMainnet, StacksTestnet } from "@stacks/network"
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  bufferCV,
} from "@stacks/transactions"

const appConfig = new AppConfig(["store_write", "publish_data"])
export const userSession = new UserSession({ appConfig })

export interface StacksWalletState {
  address: string | null
  isConnected: boolean
  network: "mainnet" | "testnet"
}

export class StacksWalletService {
  private network: StacksMainnet | StacksTestnet

  constructor(networkType: "mainnet" | "testnet" = "testnet") {
    this.network = networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet()
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
          const userData = userSession.loadUserData()
          resolve({
            address: userData.profile.stxAddress.testnet,
            isConnected: true,
            network: "testnet",
          })
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
    const userData = userSession.loadUserData()
    return userData.profile.stxAddress.testnet
  }

  isConnected(): boolean {
    return userSession.isUserSignedIn()
  }

  async transferUSDCx(
    amount: number,
    recipient: string,
    contractAddress: string,
    contractName = "usdcx-token",
  ): Promise<string> {
    const txOptions = {
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount * 1000000), // Convert to 6 decimals
        principalCV(this.getAddress()!),
        principalCV(recipient),
        noneCV(),
      ],
      senderKey: this.getAddress()!,
      validateWithAbi: true,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
    }

    const transaction = await makeContractCall(txOptions)
    const broadcastResponse = await broadcastTransaction(transaction, this.network)

    if (broadcastResponse.error) {
      throw new Error(`Transaction failed: ${broadcastResponse.error}`)
    }

    return broadcastResponse.txid
  }

  async getUSDCxBalance(contractAddress: string, contractName = "usdcx-token"): Promise<number> {
    const address = this.getAddress()
    if (!address) return 0

    try {
      const response = await fetch(
        `${this.network.coreApiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: address,
            arguments: [principalCV(address).serialize().toString("hex")],
          }),
        },
      )

      const data = await response.json()
      return Number.parseInt(data.result.value, 16) / 1000000 // Convert from 6 decimals
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

  async getTransactionStatus(txId: string): Promise<{
    status: "pending" | "success" | "failed"
    result?: any
  }> {
    try {
      const response = await fetch(`${this.network.coreApiUrl}/extended/v1/tx/${txId}`)
      const data = await response.json()

      if (data.tx_status === "success") {
        return { status: "success", result: data.tx_result }
      } else if (data.tx_status === "abort_by_response" || data.tx_status === "abort_by_post_condition") {
        return { status: "failed" }
      }

      return { status: "pending" }
    } catch (error) {
      console.error("Error fetching transaction status:", error)
      return { status: "pending" }
    }
  }
}

// Helper function to create none CV
function noneCV() {
  return { type: 9 } as any
}

// Singleton instance
let stacksWalletService: StacksWalletService | null = null

export function getStacksWalletService(network: "mainnet" | "testnet" = "testnet"): StacksWalletService {
  if (!stacksWalletService) {
    stacksWalletService = new StacksWalletService(network)
  }
  return stacksWalletService
}
