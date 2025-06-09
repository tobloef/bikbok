/** @import { BuildConfig } from "../../build-config.js"; */
export class Copy extends Module {
    /**
     *
     * @param {Object} options
     * @param {string} options.from
     * @param {string} options.to
     * @param {RegExp[]} [options.include]
     * @param {RegExp[]} [options.exclude]
     * @param {boolean} [options.recursive]
     * @param {boolean} [options.filesOnly]
     * @param {(input: Buffer) => Buffer} [options.middleware]
     */
    constructor(options: {
        from: string;
        to: string;
        include?: RegExp[] | undefined;
        exclude?: RegExp[] | undefined;
        recursive?: boolean | undefined;
        filesOnly?: boolean | undefined;
        middleware?: ((input: Buffer) => Buffer) | undefined;
    });
    /** @type {string} */
    from: string;
    /** @type {string} */
    to: string;
    /** @type {RegExp[] | null} */
    include: RegExp[] | null;
    /** @type {RegExp[] | null} */
    exclude: RegExp[] | null;
    /** @type {boolean} */
    recursive: boolean;
    /** @type {boolean | null} */
    filesOnly: boolean | null;
    /** @type {((input: Buffer) => Buffer) | null} */
    middleware: ((input: Buffer) => Buffer) | null;
    #private;
}
import { Module } from "../module.js";
