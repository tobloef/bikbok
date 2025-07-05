/** @import { BuildEventListener } from "../../events.js"; */
/** @import { BuildConfig } from "../../build-config.js"; */
export class Execute extends Module {
    /**
     * @param {Object} options
     * @param {string} options.command
     * @param {string} [options.path]
     */
    constructor(options: {
        command: string;
        path?: string | undefined;
    });
    /**
     * Command to execute.
     * @type {string}
     */
    command: string;
    /**
     * Path to execute the command in.
     * @type {string}
     */
    path: string;
    #private;
}
import { Module } from "../module.js";
