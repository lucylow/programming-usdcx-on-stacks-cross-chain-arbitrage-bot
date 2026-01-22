"use client"

import { Shield } from "lucide-react"

interface Props {
  score: number
}

export function PrivacyScoreChip({ score }: Props) {
  const getColor = () => {
    if (score >= 85) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    if (score >= 70) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (score >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getColor()}`}
    >
      <Shield className="w-3 h-3" />
      {score}%
    </span>
  )
}
