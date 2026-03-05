declare module "chokidar" {
  export interface FSWatcher {
    on(event: "add", listener: (path: string) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    close(): Promise<void>;
  }

  export interface AwaitWriteFinishOptions {
    readonly stabilityThreshold?: number;
    readonly pollInterval?: number;
  }

  export interface WatchOptions {
    readonly persistent?: boolean;
    readonly ignoreInitial?: boolean;
    readonly awaitWriteFinish?: boolean | AwaitWriteFinishOptions;
  }

  export function watch(
    paths: string | readonly string[],
    options?: WatchOptions
  ): FSWatcher;
}

