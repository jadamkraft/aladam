import type {
  AsyncBackoffSettings,
  BatesID,
  CaseID
} from "@asymmetric-legal/types";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  readonly batesId?: BatesID;
  readonly caseId?: CaseID;
} & Readonly<Record<string, unknown>>;

export interface LogRecord extends LogContext {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
}

export interface Logger {
  readonly level: LogLevel;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export interface StructuredLogger extends Logger {
  withContext(context: LogContext): StructuredLogger;
}

const levelOrder: LogLevel[] = ["debug", "info", "warn", "error"];

const shouldLog = (currentLevel: LogLevel, messageLevel: LogLevel): boolean =>
  levelOrder.indexOf(messageLevel) >= levelOrder.indexOf(currentLevel);

export function createStructuredLogger(
  sink: (record: LogRecord) => void,
  level: LogLevel = "info",
  baseContext?: LogContext
): StructuredLogger {
  const logAtLevel =
    (messageLevel: LogLevel) =>
    (message: string, context?: LogContext): void => {
      if (!shouldLog(level, messageLevel)) {
        return;
      }

      const record: LogRecord = {
        timestamp: new Date().toISOString(),
        level: messageLevel,
        message,
        ...(baseContext ?? {}),
        ...(context ?? {})
      };

      sink(record);
    };

  const withContext = (context: LogContext): StructuredLogger =>
    createStructuredLogger(sink, level, {
      ...(baseContext ?? {}),
      ...context
    });

  return {
    level,
    debug: logAtLevel("debug"),
    info: logAtLevel("info"),
    warn: logAtLevel("warn"),
    error: logAtLevel("error"),
    withContext
  };
}

export function createConsoleLogger(level: LogLevel = "info"): StructuredLogger {
  return createStructuredLogger((record: LogRecord) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(record));
  }, level);
}

interface BackoffCoreOptions {
  readonly logger?: Logger;
  readonly useJitter: boolean;
}

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const computeNextDelayMs = (
  currentDelayMs: number,
  settings: AsyncBackoffSettings,
  useJitter: boolean
): number => {
  const base = useJitter ? Math.random() * currentDelayMs : currentDelayMs;
  const next = base * settings.factor;
  return next > settings.maxDelayMs ? settings.maxDelayMs : next;
};

async function executeWithBackoffCore<T>(
  operation: (attempt: number) => Promise<T>,
  settings: AsyncBackoffSettings,
  options: BackoffCoreOptions
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
        options.logger?.error("Operation failed after max retries", {
          attempt,
          error
        });
        throw error;
      }

      options.logger?.warn("Operation failed, backing off", {
        attempt,
        delay,
        error
      });

      const delayToUse = computeNextDelayMs(delay, settings, options.useJitter);
      await wait(delayToUse);
      delay = delayToUse;
    }
  }
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  settings: AsyncBackoffSettings
): Promise<T> {
  return executeWithBackoffCore(
    () => fn(),
    settings,
    {
      useJitter: true
    }
  );
}

export async function withExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  settings: AsyncBackoffSettings,
  logger?: Logger
): Promise<T> {
  return executeWithBackoffCore(operation, settings, {
    logger,
    useJitter: true
  });
}
