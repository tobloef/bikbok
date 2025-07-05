class BuildError extends Error {
  /**
   * @param {string} message
   * @param {Object} [extra]
   * @param {Error} [extra.cause]
   */
  constructor(message, extra) {
    super(message, extra);
    this.name = this.constructor.name;
  }
}

export default BuildError;
