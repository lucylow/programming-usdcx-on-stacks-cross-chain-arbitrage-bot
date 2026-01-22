type LogLevel = "info" | "warn" | "error" | "debug"

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    switch (level) {
      case "error":
        console.error(formattedMessage, ...args)
        break
      case "warn":
        console.warn(formattedMessage, ...args)
        break
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(formattedMessage, ...args)
        }
        break
      case "info":
      default:
        console.log(formattedMessage, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    this.log("info", message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.log("error", message, ...args)
  }

  debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args)
  }
}

export const logger = new Logger()
