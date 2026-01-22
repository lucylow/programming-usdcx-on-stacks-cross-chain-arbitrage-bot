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
} from "@stacks/transactions"
import { StacksMainnet, StacksTestnet } from "@stacks/network"

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

export class StacksContractService {
  private network: StacksMainnet | StacksTestnet
  private networkType: NetworkType
  private addresses: typeof CONTRACT_ADDRESSES.mainnet

  constructor(networkType: NetworkType = "testnet") {
    this.networkType = networkType
    this.network = networkType === "mainnet" ? new StacksMainnet() : new StacksTestnet()
    this.addresses = CONTRACT_ADDRESSES[networkType]
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
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
    return await broadcastTransaction(transaction, this.network)
  }

  // ================ READ FUNCTIONS ================
  getContractAddresses() {
    return this.addresses
  }

  getNetwork() {
    return this.network
  }

  getNetworkType() {
    return this.networkType
  }
}

export const stacksContracts = new StacksContractService(
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as NetworkType) || "testnet",
)
