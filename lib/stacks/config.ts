import { AppConfig, UserSession } from "@stacks/connect"

const appConfig = new AppConfig(["store_write", "publish_data"])
export const userSession = new UserSession({ appConfig })

export const APP_DETAILS = {
  name: "Cross-Chain Arbitrage Bot",
  icon: typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png",
}

// Contract addresses for different networks
export const CONTRACTS = {
  testnet: {
    usdcxToken: process.env.NEXT_PUBLIC_USDCX_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    usdcxBridge: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    daoGovernance: process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    simpleDao: process.env.NEXT_PUBLIC_SIMPLE_DAO_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    daoExtension: process.env.NEXT_PUBLIC_DAO_EXTENSION_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    nftTrait: process.env.NEXT_PUBLIC_NFT_TRAIT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    privacyBadgeNft: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
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
