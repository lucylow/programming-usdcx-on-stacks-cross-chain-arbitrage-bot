import { StacksClient } from "./stacksClient"
import { logger } from "../utils/logger"
import { BlockchainError, getErrorMessage } from "../utils/errors"
import {
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  listCV,
  buffCV,
  cvToJSON,
  hexToCV,
  ClarityValue,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions"
import type { NetworkConfig } from "../config/types"

/**
 * Proposal state enum
 */
export enum ProposalState {
  Pending = 0x00,
  Active = 0x01,
  Executed = 0x02,
  Cancelled = 0x03,
}

/**
 * Vote support enum
 */
export enum VoteSupport {
  Against = 0x00,
  For = 0x01,
  Abstain = 0x02,
}

/**
 * Proposal data structure
 */
export interface Proposal {
  id: number
  creator: string
  title: string
  description: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  createdAt: number
  executedAt?: number
  state: ProposalState
  targetContract: string
  functionName: string
  calldata: string[]
}

/**
 * Vote data structure
 */
export interface Vote {
  proposalId: number
  voter: string
  amount: number
  support: VoteSupport
  votedAt: number
}

/**
 * Treasury balance and statistics
 */
export interface TreasuryStats {
  balance: number
  totalDeposits: number
  totalWithdrawals: number
}

/**
 * Governance token balance and voting power
 */
export interface GovernanceTokenInfo {
  balance: number
  votingPower: number
  delegatedTo?: string
  lockedAmount?: number
  lockedUntil?: number
}

/**
 * DAO Governance Service
 * Handles all interactions with DAO governance contracts on Stacks
 */
export class DaoGovernanceService {
  private stacksClient: StacksClient
  private daoContractAddress: string
  private daoContractName: string
  private governanceTokenAddress: string
  private governanceTokenName: string

  constructor(
    stacksClient: StacksClient,
    daoContractAddress: string,
    daoContractName = "dao-governance",
    governanceTokenAddress?: string,
    governanceTokenName = "governance-token",
  ) {
    this.stacksClient = stacksClient
    this.daoContractAddress = daoContractAddress
    this.daoContractName = daoContractName
    this.governanceTokenAddress = governanceTokenAddress || daoContractAddress
    this.governanceTokenName = governanceTokenName
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(
    title: string,
    description: string,
    targetContract: string,
    functionName: string,
    calldata: string[],
  ): Promise<string> {
    try {
      logger.info(`Creating proposal: ${title}`)

      // Convert calldata strings to buff CVs
      const calldataCVs = calldata.map((data) => buffCV(Buffer.from(data, "hex")))

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "create-proposal",
        functionArgs: [
          stringAsciiCV(title),
          stringUtf8CV(description),
          principalCV(targetContract),
          stringAsciiCV(functionName),
          listCV(calldataCVs),
        ],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Proposal created successfully: ${txId}`)
      return txId
    } catch (error) {
      logger.error("Failed to create proposal:", error)
      throw new BlockchainError(
        `Failed to create proposal: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Activate a proposal (move from pending to active)
   */
  async activateProposal(proposalId: number): Promise<string> {
    try {
      logger.info(`Activating proposal ${proposalId}`)

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "activate-proposal",
        functionArgs: [uintCV(proposalId)],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Proposal ${proposalId} activated: ${txId}`)
      return txId
    } catch (error) {
      logger.error(`Failed to activate proposal ${proposalId}:`, error)
      throw new BlockchainError(
        `Failed to activate proposal: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: number, support: VoteSupport, votingPower: number): Promise<string> {
    try {
      logger.info(`Voting on proposal ${proposalId} with support: ${support}`)

      const supportBuff = Buffer.from([support])

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "vote-on-proposal",
        functionArgs: [uintCV(proposalId), buffCV(supportBuff), uintCV(votingPower)],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Vote submitted for proposal ${proposalId}: ${txId}`)
      return txId
    } catch (error) {
      logger.error(`Failed to vote on proposal ${proposalId}:`, error)
      throw new BlockchainError(
        `Failed to vote on proposal: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Execute a successful proposal
   */
  async executeProposal(proposalId: number): Promise<string> {
    try {
      logger.info(`Executing proposal ${proposalId}`)

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "execute-proposal",
        functionArgs: [uintCV(proposalId)],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Proposal ${proposalId} executed: ${txId}`)
      return txId
    } catch (error) {
      logger.error(`Failed to execute proposal ${proposalId}:`, error)
      throw new BlockchainError(
        `Failed to execute proposal: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: number): Promise<Proposal | null> {
    try {
      const result = await this.stacksClient.readOnlyCall<{
        value?: {
          creator?: { value: string }
          title?: { value: string }
          description?: { value: string }
          "for-votes"?: { value: string }
          "against-votes"?: { value: string }
          "abstain-votes"?: { value: string }
          "created-at"?: { value: string }
          "executed-at"?: { value?: string }
          state?: { value: string }
          "target-contract"?: { value: string }
          "function-name"?: { value: string }
          calldata?: { value: unknown[] }
        }
      }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "get-proposal",
        functionArgs: [uintCV(proposalId)],
        senderAddress: this.stacksClient.getAddress(),
      })

      if (!result.value) {
        return null
      }

      const proposal = result.value

      return {
        id: proposalId,
        creator: proposal.creator?.value || "",
        title: proposal.title?.value || "",
        description: proposal.description?.value || "",
        forVotes: Number.parseInt(proposal["for-votes"]?.value || "0", 16),
        againstVotes: Number.parseInt(proposal["against-votes"]?.value || "0", 16),
        abstainVotes: Number.parseInt(proposal["abstain-votes"]?.value || "0", 16),
        createdAt: Number.parseInt(proposal["created-at"]?.value || "0", 16),
        executedAt: proposal["executed-at"]?.value
          ? Number.parseInt(proposal["executed-at"].value, 16)
          : undefined,
        state: Number.parseInt(proposal.state?.value || "0", 16),
        targetContract: proposal["target-contract"]?.value || "",
        functionName: proposal["function-name"]?.value || "",
        calldata: (proposal.calldata?.value as string[]) || [],
      }
    } catch (error) {
      logger.error(`Failed to get proposal ${proposalId}:`, error)
      return null
    }
  }

  /**
   * Get proposal state
   */
  async getProposalState(proposalId: number): Promise<ProposalState> {
    try {
      const result = await this.stacksClient.readOnlyCall<{ value: string }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "get-proposal-state",
        functionArgs: [uintCV(proposalId)],
        senderAddress: this.stacksClient.getAddress(),
      })

      return Number.parseInt(result.value, 16) as ProposalState
    } catch (error) {
      logger.error(`Failed to get proposal state for ${proposalId}:`, error)
      return ProposalState.Pending
    }
  }

  /**
   * Check if a user has voted on a proposal
   */
  async hasVoted(proposalId: number, voter: string): Promise<boolean> {
    try {
      const result = await this.stacksClient.readOnlyCall<{ value: boolean }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "has-voted",
        functionArgs: [uintCV(proposalId), principalCV(voter)],
        senderAddress: voter,
      })

      return result.value || false
    } catch (error) {
      logger.error(`Failed to check vote status for proposal ${proposalId}:`, error)
      return false
    }
  }

  /**
   * Get vote details for a user on a proposal
   */
  async getVote(proposalId: number, voter: string): Promise<Vote | null> {
    try {
      const result = await this.stacksClient.readOnlyCall<{
        value?: {
          amount?: { value: string }
          support?: { value: string }
          "voted-at"?: { value: string }
        }
      }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "get-vote",
        functionArgs: [uintCV(proposalId), principalCV(voter)],
        senderAddress: voter,
      })

      if (!result.value) {
        return null
      }

      const vote = result.value
      const supportHex = vote.support?.value || "00"
      const supportValue = Number.parseInt(supportHex, 16)

      return {
        proposalId,
        voter,
        amount: Number.parseInt(vote.amount?.value || "0", 16),
        support: supportValue as VoteSupport,
        votedAt: Number.parseInt(vote["voted-at"]?.value || "0", 16),
      }
    } catch (error) {
      logger.error(`Failed to get vote for proposal ${proposalId}:`, error)
      return null
    }
  }

  /**
   * Get total number of proposals
   */
  async getTotalProposals(): Promise<number> {
    try {
      const result = await this.stacksClient.readOnlyCall<{ value: string }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "get-total-proposals",
        functionArgs: [],
        senderAddress: this.stacksClient.getAddress(),
      })

      return Number.parseInt(result.value, 16)
    } catch (error) {
      logger.error("Failed to get total proposals:", error)
      return 0
    }
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    try {
      const result = await this.stacksClient.readOnlyCall<{ value: string }>({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "get-treasury-balance",
        functionArgs: [],
        senderAddress: this.stacksClient.getAddress(),
      })

      return Number.parseInt(result.value, 16) / 1e6 // Convert from micro units
    } catch (error) {
      logger.error("Failed to get treasury balance:", error)
      return 0
    }
  }

  /**
   * Deposit tokens to treasury
   */
  async depositToTreasury(amount: number): Promise<string> {
    try {
      logger.info(`Depositing ${amount} to treasury`)

      const amountMicro = Math.floor(amount * 1e6)

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.daoContractAddress,
        contractName: this.daoContractName,
        functionName: "deposit-to-treasury",
        functionArgs: [uintCV(amountMicro)],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Deposit to treasury successful: ${txId}`)
      return txId
    } catch (error) {
      logger.error("Failed to deposit to treasury:", error)
      throw new BlockchainError(
        `Failed to deposit to treasury: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Get governance token balance and voting power
   */
  async getGovernanceTokenInfo(address?: string): Promise<GovernanceTokenInfo> {
    const targetAddress = address || this.stacksClient.getAddress()

    try {
      const [balance, votingPower, delegation] = await Promise.all([
        this.stacksClient.readOnlyCall<{ value: string }>({
          contractAddress: this.governanceTokenAddress,
          contractName: this.governanceTokenName,
          functionName: "get-balance",
          functionArgs: [principalCV(targetAddress)],
          senderAddress: targetAddress,
        }),
        this.stacksClient.readOnlyCall<{ value: string }>({
          contractAddress: this.governanceTokenAddress,
          contractName: this.governanceTokenName,
          functionName: "get-voting-power",
          functionArgs: [principalCV(targetAddress)],
          senderAddress: targetAddress,
        }),
        this.stacksClient.readOnlyCall<{
          value?: {
            delegatee?: { value: string }
            "delegated-at"?: { value: string }
          }
        }>({
          contractAddress: this.governanceTokenAddress,
          contractName: this.governanceTokenName,
          functionName: "get-delegation",
          functionArgs: [principalCV(targetAddress)],
          senderAddress: targetAddress,
        }),
      ])

      return {
        balance: Number.parseInt(balance.value, 16) / 1e6,
        votingPower: Number.parseInt(votingPower.value, 16) / 1e6,
        delegatedTo: delegation.value?.delegatee?.value,
      }
    } catch (error) {
      logger.error(`Failed to get governance token info for ${targetAddress}:`, error)
      return {
        balance: 0,
        votingPower: 0,
      }
    }
  }

  /**
   * Delegate voting power to another address
   */
  async delegateVotes(delegatee: string): Promise<string> {
    try {
      logger.info(`Delegating votes to ${delegatee}`)

      const txId = await this.stacksClient.contractCall({
        contractAddress: this.governanceTokenAddress,
        contractName: this.governanceTokenName,
        functionName: "delegate-votes",
        functionArgs: [principalCV(delegatee)],
        senderKey: this.stacksClient.getPrivateKey(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      })

      logger.info(`Votes delegated successfully: ${txId}`)
      return txId
    } catch (error) {
      logger.error(`Failed to delegate votes to ${delegatee}:`, error)
      throw new BlockchainError(
        `Failed to delegate votes: ${getErrorMessage(error)}`,
        "stacks",
        { cause: error },
      )
    }
  }

  /**
   * Get all proposals (fetches up to a limit)
   */
  async getAllProposals(limit = 50): Promise<Proposal[]> {
    try {
      const totalProposals = await this.getTotalProposals()
      const proposals: Proposal[] = []

      const endId = Math.min(totalProposals, limit)
      for (let id = 1; id <= endId; id++) {
        const proposal = await this.getProposal(id)
        if (proposal) {
          proposals.push(proposal)
        }
      }

      return proposals.sort((a, b) => b.createdAt - a.createdAt) // Most recent first
    } catch (error) {
      logger.error("Failed to get all proposals:", error)
      return []
    }
  }
}
