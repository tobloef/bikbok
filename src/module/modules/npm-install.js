import { Module } from "../module.js";
import { log, LogLevel } from "../../utils/logging.js";
import { join } from "node:path";
import BuildError from "../../build-error.js";
import { fileExists } from "../../utils/file-exists.js";
import { exec } from "child_process";
import { buildEvents } from "../../events.js";
import { debounce } from "../../utils/debounce.js";
import { resolve } from "path";

/** @import { BuildEventListener } from "../../events.js"; */
/** @import { BuildConfig } from "../../build-config.js"; */

export class NpmInstall extends Module {
  /**
   * Path to the package to install dependencies from.
   * This should be the directory containing the package.json file
   * @type {string}
   */
  packagePath;

  /**
   * Path to install the dependencies to.
   * This is where the node_modules directory will be created.
   * @type {string}
   */
  destinationPath;

  /**
   * @param {Object} options
   * @param {string} [options.packagePath]
   * @param {string} [options.destinationPath]
   */
  constructor(options) {
    super();
    this.packagePath = options.packagePath ?? "./";
    this.destinationPath = options.destinationPath ?? "./";
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    await super.onBuild(params);

    log(LogLevel.INFO, `📦 Installing npm dependencies from "${this.packagePath}" to "${this.destinationPath}"`);

    const packageJsonPath = join(this.packagePath, "package.json");

    if (!await fileExists(packageJsonPath)) {
      throw new BuildError(`No package.json found in "${this.packagePath}"`);
    }

    await this.#install();
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    await super.onWatch(params);

    const debouncedInstall = debounce(() => this.#install(), 100);

    /** @type {BuildEventListener<{ absolute: string, relative: string }>} */
    const handler = async (event) => {
      const absolutePackageJsonPath = resolve(this.packagePath, "package.json");

      if (event.data.absolute !== absolutePackageJsonPath) {
        return;
      }

      log(LogLevel.VERBOSE, `File "package.json" changed, running npm install`);

      await debouncedInstall();
    };

    buildEvents.fileChanged.subscribe(handler);
  }

  async #install() {
    const command = `npm install --omit=dev --install-links --prefix ${this.destinationPath}`;
    log(LogLevel.VERBOSE, `Executing "${command}"`);

    const childProcess = exec(command);

    childProcess.stdout?.on("data", (data) => {
      log(LogLevel.VERBOSE, data);
    });

    childProcess.stderr?.on("data", (data) => {
      log(LogLevel.ERROR, data);
    });

    try {
      const exitCode = await new Promise((resolve, reject) => {
        childProcess.on("exit", resolve);
        childProcess.on("error", reject);
      });

      if (exitCode !== 0) {
        throw new Error(`Got non-zero exit code ${exitCode}`);
      }

      buildEvents.hotReload.publish("node_modules/");
    } catch (error) {
      log(LogLevel.ERROR, `Failed to install dependencies: ${error.message}`);
      throw new BuildError(`Failed to install dependencies`);
    }
  }
}