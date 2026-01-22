import { AppConfig, UserSession } from "@stacks/connect"

const appConfig = new AppConfig(["store_write", "publish_data"])
export const userSession = new UserSession({ appConfig })

export const APP_DETAILS = {
  name: "Cross-Chain Arbitrage Bot",
  icon: typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png",
}

// Contract addresses for different networks
// Support both VITE_ (Vite) and NEXT_PUBLIC_ (Next.js) prefixes for compatibility
const getEnv = (key: string, defaultValue: string) => {
  return (import.meta.env[`VITE_${key}`] || import.meta.env[`NEXT_PUBLIC_${key}`] || defaultValue) as string
}

export const CONTRACTS = {
  testnet: {
    usdcxToken: getEnv("USDCX_CONTRACT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    usdcxBridge: getEnv("BRIDGE_CONTRACT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    daoGovernance: getEnv("DAO_CONTRACT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    simpleDao: getEnv("SIMPLE_DAO_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    daoExtension: getEnv("DAO_EXTENSION_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    nftTrait: getEnv("NFT_TRAIT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
    privacyBadgeNft: getEnv("NFT_CONTRACT_ADDRESS", "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"),
  },
  mainnet: {
    usdcxToken: "",
    usdcxBridge: "",
    daoGovernance: "",
    simpleDao: "",
    daoExtension: "",
    nftTrait: "",
    privacyBadgeNft: "",
  },
}

// Contract names
export const NFT_CONTRACT_NAME = "privacy-badge-nft"
export const DAO_CONTRACT_NAME = "simple-dao"
export const DAO_EXTENSION_NAME = "dao-extension-config"
