import { Module } from "../module.js";
import {
  log,
  LogLevel,
} from "../../utils/logging.js";
import { join } from "node:path";
import BuildError from "../../build-error.js";
import { fileExists } from "../../utils/file-exists.js";
import { exec } from "child_process";
import { buildEvents } from "../../events.js";
import { debounce } from "../../utils/debounce.js";
import { getAbsolutePath } from "../../utils/get-absolute-path.js";

/** @import { BuildEventListener } from "../../events.js"; */
/** @import { BuildConfig } from "../../build-config.js"; */

export class Execute extends Module {
  /**
   * Command to execute.
   * @type {string}
   */
  command;

  /**
   * Path to execute the command in.
   * @type {string}
   */
  path;

  /**
   * @param {Object} options
   * @param {string} options.command
   * @param {string} [options.path]
   */
  constructor(options) {
    super();
    this.command = options.command;
    this.path = options.path ?? "./";
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    await super.onBuild(params);

    log(LogLevel.INFO, `🤖 Executing command in "${this.path}": ${this.command}`);

    await this.#execute();
  }

  async #execute() {
    const childProcess = exec(this.command, { cwd: this.path });

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
    } catch (error) {
      log(LogLevel.ERROR, `Failed to execute command: ${error.message}`);
      throw new BuildError(`Failed to install dependencies`, { cause: error });
    }
  }
}
