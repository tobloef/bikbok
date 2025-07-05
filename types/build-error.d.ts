export default BuildError;
declare class BuildError extends Error {
    /**
     * @param {string} message
     * @param {Object} [extra]
     * @param {Error} [extra.cause]
     */
    constructor(message: string, extra?: {
        cause?: Error | undefined;
    } | undefined);
}
