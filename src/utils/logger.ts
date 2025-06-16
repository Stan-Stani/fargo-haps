export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  error(message: string, error?: Error): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
      if (error) {
        console.error(error.stack);
      }
    }
  }

  warn(message: string): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
  }

  info(message: string): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
  }

  debug(message: string): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
}

export const logger = Logger.getInstance();