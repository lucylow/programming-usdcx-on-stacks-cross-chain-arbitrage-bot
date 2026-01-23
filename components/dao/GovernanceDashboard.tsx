"use client"

import { useState } from "react"
import { useDaoGovernance } from "../../hooks/useDaoGovernance"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Vote,
  Gavel,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ProposalState,
  VoteSupport,
  getProposalStatus,
  formatProposalState,
  formatVoteSupport,
} from "@/types/governance"
import { useStacks } from "@lib/stacks/StacksProvider"
import { formatDistanceToNow } from "date-fns"

export function GovernanceDashboard() {
  const { isSignedIn, openSignIn } = useStacks()
  const {
    proposals,
    tokenInfo,
    treasuryBalance,
    isLoading,
    error,
    createProposal,
    voteOnProposal,
    executeProposal,
    activateProposal,
    hasVoted,
    refreshProposals,
  } = useDaoGovernance()

  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)
  const [voteSupport, setVoteSupport] = useState<VoteSupport>(VoteSupport.For)
  const [votingPower, setVotingPower] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showVoteDialog, setShowVoteDialog] = useState(false)

  // Proposal form state
  const [proposalTitle, setProposalTitle] = useState("")
  const [proposalDescription, setProposalDescription] = useState("")
  const [targetContract, setTargetContract] = useState("")
  const [functionName, setFunctionName] = useState("")
  const [calldata, setCalldata] = useState("")

  const handleCreateProposal = async () => {
    if (!proposalTitle || !proposalDescription || !targetContract || !functionName) {
      return
    }

    const calldataArray = calldata ? calldata.split(",").map((s) => s.trim()) : []
    const txId = await createProposal(
      proposalTitle,
      proposalDescription,
      targetContract,
      functionName,
      calldataArray,
    )

    if (txId) {
      setShowCreateDialog(false)
      setProposalTitle("")
      setProposalDescription("")
      setTargetContract("")
      setFunctionName("")
      setCalldata("")
    }
  }

  const handleVote = async (proposalId: number) => {
    if (!votingPower || !tokenInfo) return

    const power = parseFloat(votingPower)
    if (power > tokenInfo.votingPower) {
      alert("Insufficient voting power")
      return
    }

    const txId = await voteOnProposal(proposalId, voteSupport, power)
    if (txId) {
      setShowVoteDialog(false)
      setVotingPower("")
    }
  }

  const handleExecute = async (proposalId: number) => {
    if (confirm("Are you sure you want to execute this proposal?")) {
      await executeProposal(proposalId)
    }
  }

  const handleActivate = async (proposalId: number) => {
    await activateProposal(proposalId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-400"
      case "passed":
        return "bg-emerald-500/20 text-emerald-400"
      case "rejected":
        return "bg-rose-500/20 text-rose-400"
      case "executed":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card-bg border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Treasury Balance</p>
              <p className="text-2xl font-bold text-accent">
                {treasuryBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} GOV
              </p>
            </div>
            <Wallet className="w-8 h-8 text-brand" />
          </div>
        </Card>

        <Card className="bg-card-bg border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Voting Power</p>
              <p className="text-2xl font-bold text-accent">
                {tokenInfo?.votingPower.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"} GOV
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-brand" />
          </div>
        </Card>

        <Card className="bg-card-bg border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Proposals</p>
              <p className="text-2xl font-bold text-accent">
                {proposals.filter((p) => p.state === ProposalState.Active).length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-brand" />
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gavel className="w-6 h-6" />
          Governance Proposals
        </h2>
        <div className="flex gap-2">
          <Button onClick={refreshProposals} variant="outline" className="border-white/20">
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button disabled={!isSignedIn} className="bg-brand hover:bg-brand-dark">
                <FileText className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card-bg border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>Submit a new governance proposal to the DAO</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="Proposal title"
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Detailed description of the proposal"
                    rows={4}
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Contract</Label>
                  <Input
                    value={targetContract}
                    onChange={(e) => setTargetContract(e.target.value)}
                    placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.contract-name"
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Function Name</Label>
                  <Input
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    placeholder="function-name"
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calldata (comma-separated hex strings, optional)</Label>
                  <Input
                    value={calldata}
                    onChange={(e) => setCalldata(e.target.value)}
                    placeholder="0x1234,0x5678"
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <Button onClick={handleCreateProposal} className="w-full bg-brand hover:bg-brand-dark" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Proposal"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-rose-500/10 border-rose-500/20 p-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Proposals List */}
      {isLoading && proposals.length === 0 ? (
        <Card className="bg-card-bg border-white/10 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand" />
          <p className="text-muted-foreground">Loading proposals...</p>
        </Card>
      ) : proposals.length === 0 ? (
        <Card className="bg-card-bg border-white/10 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No proposals yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const status = getProposalStatus(proposal)
            const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
            const supportPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0

            return (
              <Card key={proposal.id} className="bg-card-bg border-white/10 p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{proposal.title}</h3>
                        <Badge className={getStatusColor(status)}>{status.toUpperCase()}</Badge>
                        <Badge variant="outline" className="border-white/20">
                          #{proposal.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">For</p>
                      <p className="text-lg font-semibold text-emerald-400">{proposal.forVotes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Against</p>
                      <p className="text-lg font-semibold text-rose-400">{proposal.againstVotes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Abstain</p>
                      <p className="text-lg font-semibold text-gray-400">{proposal.abstainVotes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Votes</p>
                      <p className="text-lg font-semibold">{totalVotes.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Support: {supportPercentage.toFixed(1)}%</span>
                      <span className="text-muted-foreground">
                        {formatProposalState(proposal.state)} • Created{" "}
                        {formatDistanceToNow(new Date(proposal.createdAt * 1000), { addSuffix: true })}
                      </span>
                    </div>
                    <Progress value={supportPercentage} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    {proposal.state === ProposalState.Pending && proposal.creator === isSignedIn && (
                      <Button
                        onClick={() => handleActivate(proposal.id)}
                        variant="outline"
                        size="sm"
                        className="border-white/20"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    {proposal.state === ProposalState.Active && isSignedIn && (
                      <Button
                        onClick={() => {
                          setSelectedProposal(proposal.id)
                          setShowVoteDialog(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="border-white/20"
                      >
                        <Vote className="w-4 h-4 mr-2" />
                        Vote
                      </Button>
                    )}
                    {status === "passed" && proposal.state === ProposalState.Active && (
                      <Button
                        onClick={() => handleExecute(proposal.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Gavel className="w-4 h-4 mr-2" />
                        Execute
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProposal(proposal.id)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent className="bg-card-bg border-white/10">
          <DialogHeader>
            <DialogTitle>Vote on Proposal #{selectedProposal}</DialogTitle>
            <DialogDescription>Cast your vote using your voting power</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Vote</Label>
              <Select
                value={voteSupport.toString()}
                onValueChange={(value) => setVoteSupport(Number.parseInt(value) as VoteSupport)}
              >
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VoteSupport.For.toString()}>For</SelectItem>
                  <SelectItem value={VoteSupport.Against.toString()}>Against</SelectItem>
                  <SelectItem value={VoteSupport.Abstain.toString()}>Abstain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voting Power (Available: {tokenInfo?.votingPower.toFixed(2) || "0"} GOV)</Label>
              <Input
                type="number"
                value={votingPower}
                onChange={(e) => setVotingPower(e.target.value)}
                placeholder="0"
                max={tokenInfo?.votingPower || 0}
                className="bg-black/20 border-white/10"
              />
            </div>
            <Button
              onClick={() => selectedProposal && handleVote(selectedProposal)}
              className="w-full bg-brand hover:bg-brand-dark"
              disabled={isLoading || !votingPower}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Voting...
                </>
              ) : (
                "Submit Vote"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Wallet Prompt */}
      {!isSignedIn && (
        <Card className="bg-card-bg border-white/10 p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Connect your wallet to participate in governance</p>
          <Button onClick={openSignIn} className="bg-brand hover:bg-brand-dark">
            Connect Wallet
          </Button>
        </Card>
      )}
    </div>
  )
}
