/** @import {BuildModule} from "./modules/build-module.js"; */
import { log, LogLevel } from "./utils/logging.js";
import { isPreset, presets } from "./presets/index.js";
import { fileExists } from "./utils/file-exists.js";
import { join } from "node:path";
import { pathToFileURL } from "url";

export class BuildConfig {
  /** @type {boolean} */
  watch;
  /** @type {ServeOptions | false} */
  serve;
  /** @type {string[]} */
  ignoredFolders;
  /** @type {BuildModule[]} */
  pipeline;

  /**
   *  @param {Object} options
   *  @param {BuildModule[]} [options.pipeline]
   *  @param {boolean} [options.watch]
   *  @param {ServeOptions} [options.serve]
   *  @param {string[]} [options.ignoredFolders]
   */
  constructor(options) {
    this.pipeline = options.pipeline ?? [];
    this.watch = options.watch ?? false;
    this.serve = options.serve ?? false;
    this.ignoredFolders = options.ignoredFolders ?? ["node_modules", ".git"];
  }
}

/**
 * @return {Promise<BuildConfig>}
 */
export async function getBuildConfig() {
  const buildConfigPath = await getBuildConfigPath();

  const imported = await import(pathToFileURL(buildConfigPath).href);

  if (!imported.default) {
    throw new Error("No default export found in build config");
  }

  return imported.default;
}

/**
 * @return {Promise<string>}
 */
async function getBuildConfigPath() {
  const possiblePaths = [
    process.argv[2],
    join(process.cwd(), "build-config.js"),
    join(process.cwd(), "build-config.mjs"),
  ];

  for (const path of possiblePaths) {
    if (!await fileExists(path) && !isPreset(path)) {
      continue;
    }

    if (isPreset(path)) {
      return presets[path];
    }

    return path;
  }

  log(
    LogLevel.ERROR,
    "No build config found. You must either:" +
    "\n  * Have a build-config.js (or .mjs) file in the working directory" +
    "\n  * Specify a path to a build config as the first argument" +
    `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(", ")})`,
  );
  process.exit(1);
}

export class HotConfig {
  /** @type {boolean} */
  enabled;

  /** @type {RegExp[]} */
  patterns;

  /**
   * @param {Object} [options]
   * @param {boolean} [options.enabled]
   * @param {RegExp[]} [options.patterns]
   */
  constructor(options) {
    this.enabled = options?.enabled ?? true;
    this.patterns = options?.patterns ?? [/\.js$/];
  }
}

export class ServeOptions {
  /** @type {number} */
  port;
  /** @type {string} */
  address;
  /** @type {string} */
  directory;
  /** @type {HotConfig} */
  hot;
  /** @type {boolean} */
  open;

  /**
   * @param {Object} [options]
   * @param {number} [options.port]
   * @param {string} [options.address]
   * @param {string} [options.directory]
   * @param {boolean | HotConfig} [options.hot]
   * @param {boolean} [options.open]
   */
  constructor(options) {
    this.port = options?.port ?? 3007;
    this.address = options?.address ?? "localhost";
    this.directory = options?.directory ?? ".";
    this.open = options?.open ?? false;

    if (options?.hot === true) {
      this.hot = new HotConfig();
    } else if (options?.hot === false) {
      this.hot = new HotConfig({ enabled: false });
    } else {
      this.hot = options?.hot ?? new HotConfig();
    }
  }
}

