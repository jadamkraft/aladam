import {
  createConsoleLogger,
  generateTraceId,
  generateSpanId,
  withExponentialBackoff
} from "@asymmetric-legal/utils";
import type { AsyncBackoffSettings } from "@asymmetric-legal/types";

const logger = createConsoleLogger(process.env.LOG_LEVEL === "debug" ? "debug" : "info");

const backoffSettings: AsyncBackoffSettings = {
  initialDelayMs: 250,
  maxDelayMs: 30_000,
  factor: 2,
  maxRetries: 5
};

async function pollAndProcess(): Promise<void> {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  const scopedLogger = logger.withContext({
    traceId,
    spanId
  });

  await withExponentialBackoff(
    async () => {
      scopedLogger.debug("Vision worker poll tick");
      // Placeholder: fetch work item, call Azure Vision, persist to Supabase with audit metadata.
      return undefined;
    },
    backoffSettings,
    scopedLogger
  );
}

async function main(): Promise<void> {
  logger.info("Starting vision worker");

  // Placeholder infinite loop with resilience; in production this would be event or queue-driven.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    await pollAndProcess();
  }
}

void main();
