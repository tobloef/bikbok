import {
  log,
  LogLevel,
} from "./utils/logging.js";
import { watch } from "fs";
import { buildEvents } from "./events.js";
import { debounce } from "./utils/debounce.js";
import { stat } from "node:fs/promises";
import { getAbsolutePath } from "./utils/get-absolute-path.js";
import BuildError from "./build-error.js";

/** @import { BuildConfig } from "./build-config.js"; */

/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export async function runPipelineOnce(buildConfig) {
  log(LogLevel.INFO, "🔧 Running build pipeline:");

  const startTime = performance.now();

  for (const module of buildConfig.modules) {
    try {
      await module.onBuild({ buildConfig });
    } catch (error) {
      if (error instanceof BuildError) {
        log(LogLevel.ERROR, error.message);
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  log(LogLevel.INFO, `✅ Build completed in ${elapsedSeconds.toFixed(3)} seconds`);
}

/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export async function runPipelineContinuously(buildConfig) {
  log(LogLevel.INFO, "👀 Watching files for changes...");

  for (const module of buildConfig.modules) {
    try {
      await module.onWatch({ buildConfig });
    } catch (error) {
      if (error instanceof BuildError) {
        log(LogLevel.ERROR, error.message);
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  watchFiles(buildConfig);
}

/**
 * @param {BuildConfig} buildConfig
 */
function watchFiles(buildConfig) {
  let perPathDebouncedHandlers = new Map();

  watch(".", { recursive: true }, async (eventType, filename) => {
    if (filename === null) {
      return;
    }

    if (filename.endsWith("~")) {
      return;
    }

    const absolutePath = getAbsolutePath(filename);

    const absoluteIgnoredFolders = buildConfig.ignoredFolders.map((folder) => getAbsolutePath(folder, { isFolder: true }));

    if (absoluteIgnoredFolders.some((folder) => absolutePath.startsWith(folder))) {
      return;
    }

    let isFolder = false;
    try {
      isFolder = (await stat(absolutePath)).isDirectory();
    } catch (error) {
      // This check wasn't that important, let's just move on
      log(LogLevel.WARNING, `Failed to check if "${absolutePath}" was a folder: ${error.message}`);
    }

    if (isFolder) {
      return;
    }

    if (!perPathDebouncedHandlers.has(absolutePath)) {
      perPathDebouncedHandlers.set(
        absolutePath,
        debounce(() => {
          log(LogLevel.VERBOSE, `File changed: ${filename} (${eventType})`);
          buildEvents.fileChanged.publish({
            absolute: absolutePath,
            relative: filename,
          });
        }, 10),
      );
    }

    perPathDebouncedHandlers.get(absolutePath)();
  });
}


