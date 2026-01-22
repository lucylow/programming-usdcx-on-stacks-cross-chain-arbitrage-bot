/**
 * Blockchain Event Listener
 * Listens to on-chain events in real-time using WebSocket connections
 */

import { ethers, EventLog, Log } from "ethers"
import { logger } from "../utils/logger"
import { NetworkError } from "../utils/errors"
import { Web3DataProvider } from "./dataProvider"

export interface EventFilter {
  address?: string
  topics?: (string | string[])[]
  fromBlock?: number | "latest" | "pending"
  toBlock?: number | "latest" | "pending"
}

export interface EventListenerConfig {
  chainId: number
  contractAddress: string
  abi: any[]
  eventName: string
  filter?: EventFilter
  pollInterval?: number // For HTTP polling fallback
}

export interface EventData {
  eventName: string
  contractAddress: string
  blockNumber: number
  blockHash: string
  transactionHash: string
  transactionIndex: number
  logIndex: number
  args: any
  timestamp?: number
}

export type EventCallback = (event: EventData) => void | Promise<void>

export class BlockchainEventListener {
  private listeners: Map<string, {
    contract: ethers.Contract
    provider: ethers.WebSocketProvider | ethers.JsonRpcProvider
    callbacks: Set<EventCallback>
    isActive: boolean
  }> = new Map()

  private pollIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(private dataProvider: Web3DataProvider) {}

  /**
   * Subscribe to contract events
   */
  async subscribe(
    config: EventListenerConfig,
    callback: EventCallback,
  ): Promise<string> {
    const listenerId = `${config.chainId}_${config.contractAddress}_${config.eventName}`

    try {
      let listener = this.listeners.get(listenerId)

      if (!listener) {
        // Get provider
        let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider
        try {
          provider = await this.dataProvider.getWebSocketProvider(config.chainId)
        } catch (error) {
          logger.warn(`WebSocket not available, using HTTP provider for chain ${config.chainId}`)
          provider = this.dataProvider.getProvider(config.chainId)
        }

        // Create contract instance
        const contract = new ethers.Contract(
          config.contractAddress,
          config.abi,
          provider,
        )

        listener = {
          contract,
          provider,
          callbacks: new Set(),
          isActive: false,
        }

        this.listeners.set(listenerId, listener)

        // Setup event listener
        await this.setupEventListener(listenerId, config, listener)
      }

      // Add callback
      listener.callbacks.add(callback)

      logger.info(
        `Subscribed to event ${config.eventName} on contract ${config.contractAddress} (chain ${config.chainId})`,
      )

      return listenerId
    } catch (error: any) {
      logger.error(`Error subscribing to event:`, error)
      throw new NetworkError(`Failed to subscribe to event: ${error.message}`, {
        config,
        error: error.message,
      })
    }
  }

  /**
   * Setup event listener
   */
  private async setupEventListener(
    listenerId: string,
    config: EventListenerConfig,
    listener: {
      contract: ethers.Contract
      provider: ethers.WebSocketProvider | ethers.JsonRpcProvider
      callbacks: Set<EventCallback>
      isActive: boolean
    },
  ): Promise<void> {
    if (listener.isActive) {
      return
    }

    listener.isActive = true

    // Use WebSocket if available, otherwise fallback to polling
    if (listener.provider instanceof ethers.WebSocketProvider) {
      // WebSocket-based event listening
      listener.contract.on(config.eventName, async (...args: any[]) => {
        const event = args[args.length - 1] as EventLog

        try {
          const block = await listener.provider.getBlock(event.blockNumber)
          const eventData: EventData = {
            eventName: config.eventName,
            contractAddress: config.contractAddress,
            blockNumber: event.blockNumber,
            blockHash: event.blockHash,
            transactionHash: event.transactionHash,
            transactionIndex: event.transactionIndex,
            logIndex: event.index,
            args: event.args,
            timestamp: block?.timestamp,
          }

          // Call all callbacks
          for (const callback of listener.callbacks) {
            try {
              await callback(eventData)
            } catch (error) {
              logger.error(`Error in event callback:`, error)
            }
          }
        } catch (error) {
          logger.error(`Error processing event:`, error)
        }
      })
    } else {
      // HTTP polling fallback
      const pollInterval = config.pollInterval || 5000
      let lastBlockNumber = await listener.provider.getBlockNumber()

      const interval = setInterval(async () => {
        try {
          const currentBlock = await listener.provider.getBlockNumber()
          
          if (currentBlock > lastBlockNumber) {
            const filter = {
              address: config.contractAddress,
              topics: listener.contract.filters[config.eventName]().topics,
              fromBlock: lastBlockNumber + 1,
              toBlock: currentBlock,
            }

            const logs = await listener.provider.getLogs(filter)

            for (const log of logs) {
              try {
                const parsedLog = listener.contract.interface.parseLog(log as Log)
                if (parsedLog && parsedLog.name === config.eventName) {
                  const block = await listener.provider.getBlock(log.blockNumber)
                  
                  const eventData: EventData = {
                    eventName: config.eventName,
                    contractAddress: config.contractAddress,
                    blockNumber: log.blockNumber,
                    blockHash: log.blockHash,
                    transactionHash: log.transactionHash,
                    transactionIndex: log.transactionIndex || 0,
                    logIndex: log.index || 0,
                    args: parsedLog.args,
                    timestamp: block?.timestamp,
                  }

                  // Call all callbacks
                  for (const callback of listener.callbacks) {
                    try {
                      await callback(eventData)
                    } catch (error) {
                      logger.error(`Error in event callback:`, error)
                    }
                  }
                }
              } catch (error) {
                logger.debug(`Error parsing log:`, error)
              }
            }

            lastBlockNumber = currentBlock
          }
        } catch (error) {
          logger.error(`Error polling for events:`, error)
        }
      }, pollInterval)

      this.pollIntervals.set(listenerId, interval)
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(listenerId: string, callback?: EventCallback): Promise<void> {
    const listener = this.listeners.get(listenerId)
    if (!listener) {
      return
    }

    if (callback) {
      listener.callbacks.delete(callback)
      
      // If no more callbacks, remove listener
      if (listener.callbacks.size === 0) {
        await this.removeListener(listenerId, listener)
      }
    } else {
      // Remove all callbacks
      await this.removeListener(listenerId, listener)
    }
  }

  /**
   * Remove listener completely
   */
  private async removeListener(
    listenerId: string,
    listener: {
      contract: ethers.Contract
      provider: ethers.WebSocketProvider | ethers.JsonRpcProvider
      callbacks: Set<EventCallback>
      isActive: boolean
    },
  ): Promise<void> {
    try {
      // Remove all event listeners
      listener.contract.removeAllListeners()
      listener.isActive = false

      // Clear polling interval if exists
      const interval = this.pollIntervals.get(listenerId)
      if (interval) {
        clearInterval(interval)
        this.pollIntervals.delete(listenerId)
      }

      this.listeners.delete(listenerId)
      logger.info(`Removed listener ${listenerId}`)
    } catch (error) {
      logger.error(`Error removing listener:`, error)
    }
  }

  /**
   * Get historical events
   */
  async getHistoricalEvents(
    config: EventListenerConfig,
    fromBlock: number,
    toBlock: number | "latest",
  ): Promise<EventData[]> {
    try {
      const provider = this.dataProvider.getProvider(config.chainId)
      const contract = new ethers.Contract(config.contractAddress, config.abi, provider)

      const filter = contract.filters[config.eventName]()
      const logs = await provider.getLogs({
        address: config.contractAddress,
        topics: filter.topics,
        fromBlock,
        toBlock,
      })

      const events: EventData[] = []

      for (const log of logs) {
        try {
          const parsedLog = contract.interface.parseLog(log as Log)
          if (parsedLog && parsedLog.name === config.eventName) {
            const block = await provider.getBlock(log.blockNumber)
            
            events.push({
              eventName: config.eventName,
              contractAddress: config.contractAddress,
              blockNumber: log.blockNumber,
              blockHash: log.blockHash,
              transactionHash: log.transactionHash,
              transactionIndex: log.transactionIndex || 0,
              logIndex: log.index || 0,
              args: parsedLog.args,
              timestamp: block?.timestamp,
            })
          }
        } catch (error) {
          logger.debug(`Error parsing historical log:`, error)
        }
      }

      return events
    } catch (error: any) {
      logger.error(`Error fetching historical events:`, error)
      throw new NetworkError(`Failed to fetch historical events: ${error.message}`, {
        config,
        fromBlock,
        toBlock,
        error: error.message,
      })
    }
  }

  /**
   * Get active listeners
   */
  getActiveListeners(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * Cleanup all listeners
   */
  async cleanup(): Promise<void> {
    const listenerIds = Array.from(this.listeners.keys())
    
    for (const listenerId of listenerIds) {
      const listener = this.listeners.get(listenerId)
      if (listener) {
        await this.removeListener(listenerId, listener)
      }
    }

    logger.info("All event listeners cleaned up")
  }
}

