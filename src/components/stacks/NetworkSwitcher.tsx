"use client"

import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStacksNetwork } from "@lib/stacks/hooks"

export function NetworkSwitcher() {
  const { network, networkInfo, switchToMainnet, switchToTestnet, isMainnet, isTestnet } = useStacksNetwork()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-border bg-transparent hover:bg-muted">
          <Globe className="w-4 h-4 mr-2" />
          <span className="capitalize">{network}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-border">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">Select Network</p>
          <p className="text-xs text-muted-foreground">Chain ID: {networkInfo.chainId}</p>
        </div>
        <DropdownMenuItem
          onClick={switchToTestnet}
          className="cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="font-medium">Testnet</div>
            <div className="text-xs text-muted-foreground">For testing and development</div>
          </div>
          {isTestnet && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={switchToMainnet}
          className="cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="font-medium">Mainnet</div>
            <div className="text-xs text-muted-foreground">Production network</div>
          </div>
          {isMainnet && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
        <div className="px-3 py-2 border-t border-border mt-2">
          <a
            href={`${networkInfo.explorerUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View on Explorer →
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
