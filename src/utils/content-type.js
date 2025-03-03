import path from "node:path";

/**
 * @enum {string}
 */
export const ContentType = {
  BINARY: "application/octet-stream",
  TEXT: "text/plain",
  HTML: "text/html",
  JS: "text/javascript",
  CSS: "text/css",
  JSON: "application/json",
  PNG: "image/png",
  JPEG: "image/jpeg",
  GIF: "image/gif",
  SVG: "image/svg+xml",
  APNG: "image/apng",
  WEBP: "image/webp",
  BMP: "image/bmp",
  ICO: "image/x-icon",
  XML: "application/xml",
  PDF: "application/pdf",
  ZIP: "application/zip",
}

/** @type {Record<string, string>} */
const contentTypeByExtension = {
  ".bin": ContentType.BINARY,
  ".txt": ContentType.TEXT,
  ".html": ContentType.HTML,
  ".js": ContentType.JS,
  ".mjs": ContentType.JS,
  ".cjs": ContentType.JS,
  ".ts": ContentType.JS,
  ".css": ContentType.CSS,
  ".json": ContentType.JSON,
  ".png": ContentType.PNG,
  ".jpg": ContentType.JPEG,
  ".jpeg": ContentType.JPEG,
  ".gif": ContentType.GIF,
  ".svg": ContentType.SVG,
  ".apng": ContentType.APNG,
  ".webp": ContentType.WEBP,
  ".bmp": ContentType.BMP,
  ".ico": ContentType.ICO,
  ".xml": ContentType.XML,
  ".pdf": ContentType.PDF,
  ".zip": ContentType.ZIP,
};

/**
 * @param {string} filePath
 * @return {string}
 */
export const getContentTypeByPath = (filePath) => {
  const extension = path.extname(filePath);
  return contentTypeByExtension[extension] ?? ContentType.TEXT;
};