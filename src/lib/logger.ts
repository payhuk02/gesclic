type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : "";
    const errorStr = entry.error ? ` | Error: ${entry.error.message}` : "";
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private log(entry: LogEntry): void {
    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const formatted = this.formatLog(entry);
      switch (entry.level) {
        case "debug":
          console.debug(formatted);
          break;
        case "info":
          console.info(formatted);
          break;
        case "warn":
          console.warn(formatted);
          break;
        case "error":
          console.error(formatted, entry.error);
          break;
      }
    }

    // TODO: Send to monitoring service in production (e.g., Sentry, LogRocket)
    // if (!this.isDevelopment && entry.level === "error") {
    //   sendToMonitoringService(entry);
    // }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry("debug", message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry("warn", message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry("error", message, context, error));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
