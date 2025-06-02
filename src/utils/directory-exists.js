import { stat } from "node:fs/promises";

/**
 * Check if the directory at the given path exists and is indeed a directory.
 * @param file {string}
 * @return {Promise<boolean>}
 */
export async function directoryExists(file) {
  try {
    return (await stat(file)).isDirectory();
  } catch (e) {
    return false;
  }
}
