"use client"

import { useState, useEffect } from "react"
import { useStacks } from "@/lib/stacks/StacksProvider"
import { CONTRACTS } from "@/lib/stacks/config"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Vote, Gavel, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import {
  callReadOnlyFunction,
  uintCV,
  boolCV,
  contractPrincipalCV,
  stringAsciiCV,
  cvToJSON,
  PostConditionMode,
  AnchorMode,
} from "@stacks/transactions"
import { StacksTestnet } from "@stacks/network"

const network = new StacksTestnet()
const DAO_ADDRESS = CONTRACTS.testnet.daoGovernance
const DAO_NAME = "simple-dao"
const EXT_NAME = "dao-extension-config"

interface Proposal {
  id: number
  creator: string
  target: string
  function: string
  value: number
  yesVotes: number
  noVotes: number
  startHeight: number
  endHeight: number
  executed: boolean
}

export function DaoPanel() {
  const { isSignedIn, userData, openSignIn, doContractCall } = useStacks()
  const [value, setValue] = useState("0")
  const [votingPeriod, setVotingPeriod] = useState("10")
  const [proposalId, setProposalId] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentParam, setCurrentParam] = useState<number | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])

  const currentAddress = isSignedIn ? userData?.profile?.stxAddress?.testnet : undefined

  // Fetch current parameter value
  const fetchCurrentParam = async () => {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DAO_ADDRESS,
        contractName: EXT_NAME,
        functionName: "get-important-parameter",
        functionArgs: [],
        senderAddress: currentAddress || DAO_ADDRESS,
        network,
      })
      const json = cvToJSON(result)
      if (json.success && json.value?.value) {
        setCurrentParam(Number.parseInt(json.value.value))
      }
    } catch (e) {
      console.error("Error fetching parameter:", e)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchCurrentParam()
    }
  }, [isSignedIn])

  const createProposal = async () => {
    if (!currentAddress) {
      openSignIn()
      return
    }

    setIsLoading(true)
    setStatus("Creating proposal...")

    try {
      const v = Number.parseInt(value || "0", 10)
      const period = Number.parseInt(votingPeriod || "10", 10)

      await doContractCall({
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "create-proposal",
        functionArgs: [
          contractPrincipalCV(DAO_ADDRESS, EXT_NAME),
          stringAsciiCV("execute-proposal"),
          uintCV(v),
          uintCV(period),
        ],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setStatus(`Proposal created! TX: ${data.txId}`)
          setIsLoading(false)
        },
        onCancel: () => {
          setStatus("Proposal creation cancelled")
          setIsLoading(false)
        },
      })
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
      setIsLoading(false)
    }
  }

  const vote = async (support: boolean) => {
    if (!currentAddress) {
      openSignIn()
      return
    }

    if (!proposalId) {
      setStatus("Please enter a proposal ID")
      return
    }

    setIsLoading(true)
    setStatus(`Voting ${support ? "YES" : "NO"}...`)

    try {
      await doContractCall({
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "vote",
        functionArgs: [uintCV(Number.parseInt(proposalId, 10)), boolCV(support)],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setStatus(`Vote submitted! TX: ${data.txId}`)
          setIsLoading(false)
        },
        onCancel: () => {
          setStatus("Vote cancelled")
          setIsLoading(false)
        },
      })
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
      setIsLoading(false)
    }
  }

  const executeProposal = async () => {
    if (!proposalId) {
      setStatus("Please enter a proposal ID")
      return
    }

    setIsLoading(true)
    setStatus("Executing proposal...")

    try {
      await doContractCall({
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "execute",
        functionArgs: [uintCV(Number.parseInt(proposalId, 10))],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setStatus(`Proposal executed! TX: ${data.txId}`)
          setIsLoading(false)
          fetchCurrentParam()
        },
        onCancel: () => {
          setStatus("Execution cancelled")
          setIsLoading(false)
        },
      })
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
      setIsLoading(false)
    }
  }

  const checkProposal = async () => {
    if (!proposalId) {
      setStatus("Please enter a proposal ID")
      return
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress: DAO_ADDRESS,
        contractName: DAO_NAME,
        functionName: "get-proposal",
        functionArgs: [uintCV(Number.parseInt(proposalId, 10))],
        senderAddress: currentAddress || DAO_ADDRESS,
        network,
      })

      const json = cvToJSON(result)
      if (json.value) {
        setStatus(`Proposal #${proposalId}:\n${JSON.stringify(json.value, null, 2)}`)
      } else {
        setStatus("Proposal not found")
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <Card className="bg-card-bg border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Gavel className="w-6 h-6 text-brand" />
        <h3 className="text-lg font-semibold">DAO Governance</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Create proposals, vote on changes, and execute approved decisions for the arbitrage bot parameters.
      </p>

      {/* Current Parameter Display */}
      {currentParam !== null && (
        <Card className="bg-black/20 border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Parameter Value</span>
            <span className="text-xl font-bold text-accent">{currentParam}</span>
          </div>
        </Card>
      )}

      {/* Create Proposal Section */}
      <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Create Proposal
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">New Parameter Value</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="bg-black/20 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Voting Period (blocks)</Label>
            <Input
              type="number"
              value={votingPeriod}
              onChange={(e) => setVotingPeriod(e.target.value)}
              placeholder="10"
              className="bg-black/20 border-white/10"
            />
          </div>
        </div>

        <Button
          onClick={createProposal}
          disabled={isLoading || !isSignedIn}
          className="w-full bg-brand hover:bg-brand-dark"
        >
          {isLoading ? "Processing..." : "Create Proposal"}
        </Button>
      </div>

      {/* Vote Section */}
      <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
        <h4 className="font-medium flex items-center gap-2">
          <Vote className="w-4 h-4" />
          Vote on Proposal
        </h4>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Proposal ID</Label>
          <Input
            type="number"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            placeholder="Enter proposal ID"
            className="bg-black/20 border-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => vote(true)}
            disabled={isLoading || !isSignedIn}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Vote YES
          </Button>
          <Button
            onClick={() => vote(false)}
            disabled={isLoading || !isSignedIn}
            className="bg-rose-600 hover:bg-rose-500"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Vote NO
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={checkProposal} variant="outline" className="border-white/20 bg-transparent hover:bg-white/5">
            <Clock className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button onClick={executeProposal} disabled={isLoading || !isSignedIn} className="bg-sky-600 hover:bg-sky-500">
            <Gavel className="w-4 h-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <Card className="bg-black/30 border-white/10 p-4">
          <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground font-mono">{status}</pre>
        </Card>
      )}

      {/* Connect Wallet Prompt */}
      {!isSignedIn && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">Connect wallet to participate in governance</p>
          <Button
            onClick={openSignIn}
            variant="outline"
            className="border-brand text-brand hover:bg-brand/10 bg-transparent"
          >
            Connect Wallet
          </Button>
        </div>
      )}
    </Card>
  )
}
