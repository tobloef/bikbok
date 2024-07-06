// @ts-ignore
import { socket } from "/@injected/socket.js";

/** @type {Record<string, Record<string, () => void>>} */
let reloadCallbacks = {};

/** @type {Record<string, any>} */
let moduleCache = {};

let nextId = 0;

export const modules = {
  /**
   * @param {string} canonicalPath
   * @param {Record<string, string>} attributes
   */
  get: async (canonicalPath, attributes) => {
    if (moduleCache[canonicalPath]) {
      return await moduleCache[canonicalPath];
    }

    console.debug(`Importing module "${canonicalPath}"`);
    moduleCache[canonicalPath] = new Promise(async (resolve) => {
      const module = await import(
        `${canonicalPath}?noCache=${Date.now()}`,
        attributes ? { with: attributes } : undefined,
      );
      resolve(module);
    });

    return await moduleCache[canonicalPath];
  },
  /**
   * @param {string} canonicalPath
   * @param {() => void} callback
   * */
  onReload: (canonicalPath, callback) => {
    const id = nextId++;

    if (!reloadCallbacks[canonicalPath]) {
      reloadCallbacks[canonicalPath] = {};
    }

    reloadCallbacks[canonicalPath][id] = callback;

    return () => {
      delete reloadCallbacks[canonicalPath][id];
    };
  },
  /** @param {string} canonicalPath */
  reload: (canonicalPath) => {
    const callbacksForPath = Object.values(reloadCallbacks[canonicalPath] ?? {});

    console.debug(`Reloading module "${canonicalPath}" (${callbacksForPath.length} callbacks)`);

    delete moduleCache[canonicalPath];
    callbacksForPath.forEach((callback) => callback());
    },
};

/**
 * @param {MessageEvent} event
 */
function handleMessage(event) {
  const prefix = "hot reload: ";
  if (event.data.startsWith(prefix)) {
    const absolutePath = event.data.slice(prefix.length);

    modules.reload(absolutePath);
  }
}

socket.addEventListener("message", handleMessage);

socket.addEventListener("open", () => {
  const hotEmoji = String.fromCodePoint(0x1F525);
  console.info(`${hotEmoji} Hot reloading enabled`);
});
