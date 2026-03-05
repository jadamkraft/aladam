import fs from "node:fs/promises";

import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { createConsoleLogger } from "@asymmetric-legal/utils";
import type { AsyncBackoffSettings } from "@asymmetric-legal/types";

import { DiscoveryInboxWatcher } from "./DiscoveryInboxWatcher.js";
import { FileSystemStore } from "./FileSystemStore.js";
import { VisionIngestionService } from "./VisionIngestionService.js";
import { loadDiscoveryConfig } from "./discoveryConfig.js";
import { AzureVisionProvider } from "./providers/AzureVisionProvider.js";
import type { DocumentAnalysisClientLike } from "./providers/AzureVisionProvider.js";
import type { VisionProvider } from "./providers/types.js";

const logger = createConsoleLogger(process.env.LOG_LEVEL === "debug" ? "debug" : "info");

const backoffSettings: AsyncBackoffSettings = {
  initialDelayMs: 250,
  maxDelayMs: 30_000,
  factor: 2,
  maxRetries: 5
};

function createAzureVisionProvider(): VisionProvider {
  const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
  const apiKey = process.env.AZURE_FORM_RECOGNIZER_API_KEY;
  const modelId = process.env.AZURE_FORM_RECOGNIZER_MODEL_ID ?? "prebuilt-document";

  if (endpoint === undefined || apiKey === undefined) {
    throw new Error(
      "Azure Form Recognizer configuration is missing. Ensure AZURE_FORM_RECOGNIZER_ENDPOINT and AZURE_FORM_RECOGNIZER_API_KEY are set."
    );
  }

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

  const clientLike: DocumentAnalysisClientLike = {
    async beginAnalyzeDocument(modelIdParam: string, document: Buffer) {
      return client.beginAnalyzeDocument(modelIdParam, document);
    }
  };

  return new AzureVisionProvider({
    client: clientLike,
    modelId,
    backoffSettings,
    logger
  });
}

async function main(): Promise<void> {
  logger.info("Starting vision worker");

  const discoveryConfig = loadDiscoveryConfig();

  logger.info("Resolved discovery directories", {
    inboxDir: discoveryConfig.inboxDir,
    processedDir: discoveryConfig.processedDir,
    errorDir: discoveryConfig.errorDir
  });

  await Promise.all([
    fs.mkdir(discoveryConfig.inboxDir, { recursive: true }),
    fs.mkdir(discoveryConfig.processedDir, { recursive: true }),
    fs.mkdir(discoveryConfig.errorDir, { recursive: true })
  ]);

  const visionProvider = createAzureVisionProvider();

  const fileSystemStore = new FileSystemStore(discoveryConfig.processedDir, logger);

  const ingestionService = new VisionIngestionService({
    visionProvider,
    fileSystemStore,
    backoffSettings,
    logger
  });

  const watcher = new DiscoveryInboxWatcher({
    inboxDir: discoveryConfig.inboxDir,
    errorDir: discoveryConfig.errorDir,
    ingestionService,
    logger
  });

  watcher.start();
}

void main();
