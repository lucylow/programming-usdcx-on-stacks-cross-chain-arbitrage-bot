import { useState, useEffect, useCallback } from "react"
import { useStacks } from "@lib/stacks/StacksProvider"
import { CONTRACTS } from "@lib/stacks/config"
import {
  fetchCallReadOnlyFunction,
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  listCV,
  bufferCV,
  cvToJSON,
  PostConditionMode,
  AnchorMode,
} from "@stacks/transactions"
import { STACKS_TESTNET } from "@stacks/network"
import type {
  Proposal,
  Vote,
  GovernanceTokenInfo,
  VoteSupport,
  ProposalState,
} from "@/types/governance"

const network = STACKS_TESTNET
const DAO_ADDRESS = CONTRACTS.testnet.daoGovernance
const DAO_NAME = "dao-governance"
const TOKEN_NAME = "governance-token"

interface UseDaoGovernanceReturn {
  // State
  proposals: Proposal[]
  currentProposal: Proposal | null
  tokenInfo: GovernanceTokenInfo | null
  treasuryBalance: number
  isLoading: boolean
  error: string | null

  // Actions
  createProposal: (
    title: string,
    description: string,
    targetContract: string,
    functionName: string,
    calldata: string[],
  ) => Promise<string | null>
  voteOnProposal: (proposalId: number, support: VoteSupport, votingPower: number) => Promise<string | null>
  executeProposal: (proposalId: number) => Promise<string | null>
  activateProposal: (proposalId: number) => Promise<string | null>
  getProposal: (proposalId: number) => Promise<Proposal | null>
  getVote: (proposalId: number, voter: string) => Promise<Vote | null>
  hasVoted: (proposalId: number, voter: string) => Promise<boolean>
  refreshProposals: () => Promise<void>
  refreshTokenInfo: () => Promise<void>
  refreshTreasuryBalance: () => Promise<void>
  delegateVotes: (delegatee: string) => Promise<string | null>
}

export function useDaoGovernance(): UseDaoGovernanceReturn {
  const { isSignedIn, walletInfo, network: activeNetwork } = useStacks()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null)
  const [tokenInfo, setTokenInfo] = useState<GovernanceTokenInfo | null>(null)
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentAddress = isSignedIn
    ? activeNetwork === "mainnet"
      ? walletInfo?.mainnetAddress
      : walletInfo?.testnetAddress
    : undefined

  // Fetch governance token info
  const refreshTokenInfo = useCallback(async () => {
    if (!currentAddress) return

    try {
      const [balance, votingPower, delegation] = await Promise.all([
        fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: TOKEN_NAME,
          functionName: "get-balance",
          functionArgs: [principalCV(currentAddress)],
          senderAddress: currentAddress,
          network,
        }),
        fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: TOKEN_NAME,
          functionName: "get-voting-power",
          functionArgs: [principalCV(currentAddress)],
          senderAddress: currentAddress,
          network,
        }),
        fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: TOKEN_NAME,
          functionName: "get-delegation",
          functionArgs: [principalCV(currentAddress)],
          senderAddress: currentAddress,
          network,
        }),
      ])

      const balanceJson = cvToJSON(balance)
      const votingPowerJson = cvToJSON(votingPower)
      const delegationJson = cvToJSON(delegation)

      setTokenInfo({
        balance: Number.parseInt(balanceJson.value?.value || "0", 16) / 1e6,
        votingPower: Number.parseInt(votingPowerJson.value?.value || "0", 16) / 1e6,
        delegatedTo: delegationJson.value?.value?.["delegatee"]?.value,
      })
    } catch (e) {
      console.error("Error fetching token info:", e)
      setError("Failed to fetch token info")
    }
  }, [currentAddress])

  // Fetch treasury balance
  const refreshTreasuryBalance = useCallback(async () => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "get-treasury-balance",
        functionArgs: [],
        senderAddress: currentAddress || DAO_ADDRESS,
        network,
      })

      const json = cvToJSON(result)
      if (json.value?.value) {
        setTreasuryBalance(Number.parseInt(json.value.value, 16) / 1e6)
      }
    } catch (e) {
      console.error("Error fetching treasury balance:", e)
      setError("Failed to fetch treasury balance")
    }
  }, [currentAddress])

  // Fetch a single proposal
  const getProposal = useCallback(
    async (proposalId: number): Promise<Proposal | null> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: DAO_NAME,
          functionName: "get-proposal",
          functionArgs: [uintCV(proposalId)],
          senderAddress: currentAddress || DAO_ADDRESS,
          network,
        })

        const json = cvToJSON(result)
        if (!json.value?.value) {
          return null
        }

        const proposal = json.value.value

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
          state: Number.parseInt(proposal.state?.value || "0", 16) as ProposalState,
          targetContract: proposal["target-contract"]?.value || "",
          functionName: proposal["function-name"]?.value || "",
          calldata: (proposal.calldata?.value as string[]) || [],
        }
      } catch (e) {
        console.error(`Error fetching proposal ${proposalId}:`, e)
        return null
      }
    },
    [currentAddress],
  )

  // Fetch all proposals
  const refreshProposals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get total proposals count
      const totalResult = await fetchCallReadOnlyFunction({
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "get-total-proposals",
        functionArgs: [],
        senderAddress: currentAddress || DAO_ADDRESS,
        network,
      })

      const totalJson = cvToJSON(totalResult)
      const totalProposals = Number.parseInt(totalJson.value?.value || "0", 16)

      // Fetch proposals (limit to last 20)
      const proposalPromises: Promise<Proposal | null>[] = []
      const endId = Math.min(totalProposals, Math.max(1, totalProposals - 20))
      for (let id = totalProposals; id >= endId; id--) {
        proposalPromises.push(getProposal(id))
      }

      const fetchedProposals = await Promise.all(proposalPromises)
      const validProposals = fetchedProposals.filter((p): p is Proposal => p !== null)

      setProposals(validProposals)
    } catch (e) {
      console.error("Error fetching proposals:", e)
      setError("Failed to fetch proposals")
    } finally {
      setIsLoading(false)
    }
  }, [currentAddress, getProposal])

  // Create proposal
  const createProposal = useCallback(
    async (
      title: string,
      description: string,
      targetContract: string,
      functionName: string,
      calldata: string[],
    ): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      setIsLoading(true)
      setError(null)

      // NOTE: This project currently doesn't expose a contract-call helper in StacksProvider.
      // Keep the hook buildable by stubbing write methods until a contract-call integration is added.
      setIsLoading(false)
      setError("Contract calls are not configured in this build")
      return null
    },
    [currentAddress],
  )

  // Vote on proposal
  const voteOnProposal = useCallback(
    async (proposalId: number, support: VoteSupport, votingPower: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      setIsLoading(true)
      setError(null)

      setIsLoading(false)
      setError("Contract calls are not configured in this build")
      return null
    },
    [currentAddress],
  )

  // Execute proposal
  const executeProposal = useCallback(
    async (proposalId: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      setIsLoading(true)
      setError(null)

      setIsLoading(false)
      setError("Contract calls are not configured in this build")
      return null
    },
    [currentAddress],
  )

  // Activate proposal
  const activateProposal = useCallback(
    async (proposalId: number): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      setIsLoading(true)
      setError(null)

      setIsLoading(false)
      setError("Contract calls are not configured in this build")
      return null
    },
    [currentAddress],
  )

  // Get vote
  const getVote = useCallback(
    async (proposalId: number, voter: string): Promise<Vote | null> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: DAO_NAME,
          functionName: "get-vote",
          functionArgs: [uintCV(proposalId), principalCV(voter)],
          senderAddress: voter,
          network,
        })

        const json = cvToJSON(result)
        if (!json.value?.value) {
          return null
        }

        const vote = json.value.value
        const supportHex = vote.support?.value || "00"
        const supportValue = Number.parseInt(supportHex, 16)

        return {
          proposalId,
          voter,
          amount: Number.parseInt(vote.amount?.value || "0", 16) / 1e6,
          support: supportValue as VoteSupport,
          votedAt: Number.parseInt(vote["voted-at"]?.value || "0", 16),
        }
      } catch (e) {
        console.error(`Error fetching vote for proposal ${proposalId}:`, e)
        return null
      }
    },
    [],
  )

  // Check if user has voted
  const hasVoted = useCallback(
    async (proposalId: number, voter: string): Promise<boolean> => {
      try {
        const result = await fetchCallReadOnlyFunction({
          contractAddress: DAO_ADDRESS,
          contractName: DAO_NAME,
          functionName: "has-voted",
          functionArgs: [uintCV(proposalId), principalCV(voter)],
          senderAddress: voter,
          network,
        })

        const json = cvToJSON(result)
        return json.value?.value || false
      } catch (e) {
        console.error(`Error checking vote status for proposal ${proposalId}:`, e)
        return false
      }
    },
    [],
  )

  // Delegate votes
  const delegateVotes = useCallback(
    async (delegatee: string): Promise<string | null> => {
      if (!currentAddress) {
        setError("Wallet not connected")
        return null
      }

      setIsLoading(true)
      setError(null)

      setIsLoading(false)
      setError("Contract calls are not configured in this build")
      return null
    },
    [currentAddress],
  )

  // Load data on mount and when address changes
  useEffect(() => {
    if (isSignedIn && currentAddress) {
      refreshProposals()
      refreshTokenInfo()
      refreshTreasuryBalance()
    }
  }, [isSignedIn, currentAddress, refreshProposals, refreshTokenInfo, refreshTreasuryBalance])

  return {
    proposals,
    currentProposal,
    tokenInfo,
    treasuryBalance,
    isLoading,
    error,
    createProposal,
    voteOnProposal,
    executeProposal,
    activateProposal,
    getProposal,
    getVote,
    hasVoted,
    refreshProposals,
    refreshTokenInfo,
    refreshTreasuryBalance,
    delegateVotes,
  }
}
