/** @import { BuildConfig } from "../../build-config.js"; */
export class TypeScript extends Module {
    /**
     * @param {Object} options
     * @param {string} options.from
     * @param {string} options.to
     * @param {string} [options.tsConfigPath]
     */
    constructor(options: {
        from: string;
        to: string;
        tsConfigPath?: string | undefined;
    });
    options: {
        from: string;
        to: string;
        tsConfigPath?: string | undefined;
    };
    compilerOptions: ts.CompilerOptions | undefined;
    #private;
}
import { Module } from "../module.js";
import * as ts from "typescript";
