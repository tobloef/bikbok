import { Module } from "../module.js";
import {
  log,
  LogLevel, OutputFormat,
} from "../../utils/logging.js";
import * as ts from "typescript";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import BuildError from "../../build-error.js";
import { buildEvents } from "../../events.js";

/** @import { BuildConfig } from "../../build-config.js"; */

export class TypeScript extends Module {
  options;

  /** @type {ts.CompilerOptions | undefined} */
  #compilerOptions;

  /**
   * @param {Object} options
   * @param {string} options.from
   * @param {string} options.to
   * @param {string} [options.tsConfigPath]
   */
  constructor(options) {
    super();
    this.options = options;
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    await super.onBuild(params);

    log(LogLevel.INFO, `🔨 Compiling TypeScript files from "${this.options.from}" to "${this.options.to}"`);

    const tsConfigPath = this.options.tsConfigPath ?? "tsconfig.json";
    const tsConfig = JSON.parse(await readFile(tsConfigPath, "utf-8"));
    this.compilerOptions = ts.parseJsonConfigFileContent(tsConfig, ts.sys, this.options.from).options;

    log(LogLevel.VERBOSE, `Using TypeScript configuration "${tsConfigPath}" with compiler options:\n${JSON.stringify(tsConfig.compilerOptions, null, 2)}`);

    await this.#compileAll();
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    buildEvents.fileChanged.subscribe(async (event) => {
      const startsWithFrom = event.data.relative.startsWith(this.options.from);

      const fromIsWorkingDirectory = this.options.from === "." || this.options.from === "./";
      const isInFromFolder = fromIsWorkingDirectory || startsWithFrom;
      const isInToFolder = event.data.relative.startsWith(this.options.to);

      if (!isInFromFolder || (isInToFolder && this.options.from !== this.options.to)) {
        return;
      }

      log(LogLevel.VERBOSE, `Recompiling TypeScript files due to change in "${event.data.relative}"`);

      try {
        await this.#compileAll();
      } catch (error) {
        if (error instanceof BuildError) {
          log(LogLevel.ERROR, error.message);
        } else {
          throw error;
        }
      }
    });
  }

  async #compileAll() {
    const files = await readdir(
      this.options.from,
      { withFileTypes: true, recursive: true },
    );

    const fileNames = files
      .filter((file) => !file.isDirectory())
      .map((file) => join(file.parentPath, file.name))
      .filter((file) => file.endsWith(".ts"));

    log(LogLevel.VERBOSE, `Files to compile:\n  ${fileNames.join("\n  ")}`);

    this.#compile(fileNames, this.compilerOptions);
  }

  /**
   * @param {string[]} fileNames
   * @param {ts.CompilerOptions} [options]
   */
  #compile(fileNames, options) {
    const program = ts.createProgram(fileNames, {
      ...options,
      noEmitOnError: true,
      outDir: this.options.to,
    });

    let emitResult = program.emit();

    const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
    const postEmitDiagnostics = emitResult.diagnostics;

    if (preEmitDiagnostics.length > 0) {
      throw new BuildError(this.#diagnosticsToErrorMessage(preEmitDiagnostics));
    }

    if (postEmitDiagnostics.length > 0) {
      throw new BuildError(this.#diagnosticsToErrorMessage(postEmitDiagnostics));
    }
  }

  /**
   * @param {ts.Diagnostic[] | readonly ts.Diagnostic[]} diagnostics
   */
  #diagnosticsToErrorMessage(diagnostics) {
    let message = "TypeScript compilation failed.";
    const errors = diagnostics.map(this.#diagnosticToString);

    if (errors.length > 0) {
      message += "\n" + errors.join("\n");
    }

    return message;
  }

  /**
   * @param {ts.Diagnostic} diagnostic
   */
  #diagnosticToString(diagnostic) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    let location = "";

    if (diagnostic.file !== undefined) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start ?? 0);
      location = `${diagnostic.file.fileName}:${line + 1}:${character + 1} - `;
    }

    const type = `${OutputFormat.RED}error${OutputFormat.RESET} ${OutputFormat.GREY}TS${diagnostic.code}`;

    return `${location}${type}:${OutputFormat.RESET} ${message}`
  }
}
