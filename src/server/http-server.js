import { createServer } from "node:http";
import { ContentType } from "../utils/content-type.js";
import {
  log,
  LogLevel,
} from "../utils/logging.js";

/** @import { IncomingMessage, ServerResponse, Server } from "node:http"; */
/** @import { BuildConfig, ServeOptions } from "../build-config.js"; */

/**
 * @typedef {Object} ResponseData
 * @property {Buffer} content
 * @property {ContentType} type
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @param {BuildConfig} buildConfig
 * @return {Server}
 */
export function createHttpServer(buildConfig) {
  const server = createServer();

  server.on("request", createRequestHandler(buildConfig));

  return server;
}

/**
 * @param {BuildConfig} buildConfig
 * @return {(req: IncomingMessage, res: ServerResponse) => Promise<void>}
 */
function createRequestHandler(buildConfig) {
  const {
    modules,
  } = buildConfig;

  return async (req, res) => {
    let originalUrl = req.url;

    for (const module of modules) {
      await module.onHttpRequest({ req, res, buildConfig });
    }

    /** @type {ResponseData | null} */
    let data = null;

    for (const module of modules) {
      data = await module.onHttpResponse({ data, req, res, buildConfig });
    }

    if (!data) {
      res.statusCode = 404;
      res.end("Not found");
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", data.type);
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.end(data.content);
    }

    let logMessage = `${req.method} ${res.statusCode} "${req.url}"`;
    if (originalUrl !== req.url) {
      logMessage += ` (original: "${originalUrl}")`;
    }
    log(LogLevel.VERBOSE, logMessage);
  };
}

/**
 * @param {Server} server
 * @param {ServeOptions} serveOptions
 */
export async function startServer(server, serveOptions) {
  return new Promise((resolve) => {
    const { port, address, open: shouldOpen } = serveOptions;

    server.listen(port, address, () => {
      const url = `http://${address}:${port}/`;

      log(LogLevel.INFO, `🌐 Dev server running at ${url}`);

      if (shouldOpen) {
        log(LogLevel.INFO, "🚀 Opening in browser");
        open(url);
      }

      resolve(undefined);
    });
  });
}
