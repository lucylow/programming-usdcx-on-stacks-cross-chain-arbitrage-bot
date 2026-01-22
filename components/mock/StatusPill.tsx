"use client"

import type { TxStatus } from "@/lib/mock/types"

interface Props {
  status: TxStatus | string
}

export function StatusPill({ status }: Props) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    executing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  const color = colors[status] || colors.pending

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      {status === "executing" && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
      {status.toUpperCase()}
    </span>
  )
}
