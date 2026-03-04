import type { AsyncBackoffSettings } from "@shared/types/src/index.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  readonly level: LogLevel;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createConsoleLogger(level: LogLevel = "info"): Logger {
  const levelOrder: LogLevel[] = ["debug", "info", "warn", "error"];
  const minIndex = levelOrder.indexOf(level);

  const shouldLog = (messageLevel: LogLevel): boolean =>
    levelOrder.indexOf(messageLevel) >= minIndex;

  const log =
    (messageLevel: LogLevel) =>
    (message: string, context?: Record<string, unknown>): void => {
      if (!shouldLog(messageLevel)) {
        return;
      }

      const payload = context ?? {};
      const structured = {
        timestamp: new Date().toISOString(),
        level: messageLevel,
        message,
        ...payload
      };

      // eslint-disable-next-line no-console
      console.log(JSON.stringify(structured));
    };

  return {
    level,
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error")
  };
}

export async function withExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  settings: AsyncBackoffSettings,
  logger?: Logger
): Promise<T> {
  let attempt = 0;
  let delay = settings.initialDelayMs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      attempt += 1;
      if (attempt > settings.maxRetries) {
        logger?.error("Operation failed after max retries", { attempt, error });
        throw error;
      }

      logger?.warn("Operation failed, backing off", { attempt, delay, error });

      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });

      const nextDelay = delay * settings.factor;
      delay = nextDelay > settings.maxDelayMs ? settings.maxDelayMs : nextDelay;
    }
  }
}
