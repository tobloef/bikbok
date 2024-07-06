import { dirname, resolve } from "path";
import { commentOutImports, parseImports } from "./imports.js";

/**
 * @param {string} originalCode
 * @param {string} modulePath
 * @param {string} rootPath
 * @return {Promise<string>}
 */
export async function injectHotImports(originalCode, modulePath, rootPath) {
  const imports = parseImports(originalCode);

  originalCode = commentOutImports(originalCode);

  const UNIQUE_STRING = "UFVWldpE"; // Prevent collisions
  const reimportFunction = `reimport_${UNIQUE_STRING}`;
  const HOT_PACKAGE = "/@injected/hot.js";

  let lets = [];
  let assigns = [];
  let listeners = new Set();

  for (const importInfo of imports) {
    const {
      path: importPath,
      exportName,
      importName,
      attributes,
    } = importInfo;

    const {
      isBare,
      canonicalPath,
    } = parseImportPath(importPath, modulePath, rootPath);

    if (isBare) {
      continue;
    }

    const attributesStr = attributes ? `, ${attributes}` : "";
    let assign = `${importName} = {...await modules.get("${canonicalPath}"${attributesStr})}`;
    if (exportName !== "*") {
      assign += `["${exportName}"]`;
    }
    assign += ";";
    assigns.push(assign);

    lets.push(`let ${importName};`);
    listeners.add(`modules.onReload("${canonicalPath}", ${reimportFunction});`);
  }

  let addedCode = "";

  if (imports.length > 0) {
    addedCode += (
      `${lets.join("\n")}` +
      (lets.length > 0 ? "\n\n" : "") +
      "await (async () => {\n\t" +
      `const { modules } = await import("${HOT_PACKAGE}");\n\n\t` +
      `const ${reimportFunction} = async () => {` +
      (assigns.length > 0 ? "\n\t\t" : "") +
      assigns.join("\n\t\t") +
      (assigns.length > 0 ? "\n\t" : "") +
      "}\n\n\t" +
      `await ${reimportFunction}();\n` +
      (listeners.size > 0 ? "\n\t" : "") +
      `${Array.from(listeners).join("\n\t")}` +
      (listeners.size > 0 ? "\n" : "") +
      "})();" +
      (originalCode.length > 0 ? "\n\n" : "")
    );
  }

  const generatedCode = addedCode + originalCode;

  const sourceMap = generateSourceMapForOffset({
    offset: addedCode.split("\n").length - 1,
    originalCode,
    filePath: modulePath,
    rootPath,
  });

  const base64SourceMap = Buffer.from(sourceMap).toString("base64");

  const sourceMapComment = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64SourceMap}`;

  return `${generatedCode}\n${sourceMapComment}`;
}

/**
 * @param {string} importPath
 * @param {string} parentPath
 * @param {string} rootPath
 * @return {{ isBare: boolean, canonicalPath: string }}
 */
function parseImportPath(importPath, parentPath, rootPath) {
  const isAbsolute = importPath.startsWith("/");

  const isRelative = (
    importPath.startsWith("./") ||
    importPath.startsWith("../")
  );

  const isBare = !isAbsolute && !isRelative;

  if (!isRelative) {
    return {
      isBare,
      canonicalPath: importPath,
    };
  }

  const canonicalPath = resolve(dirname(parentPath), importPath)
    .replace(resolve(rootPath), "")
    .replace(/\\/g, "/");

  return {
    isBare,
    canonicalPath,
  };
}

/**
 * Generates a sourcemap for code that has been offset by a certain amount of lines.
 * For example, the generated code might have 5 extra lines at the top, after which the original code starts.
 * @param {Object} params
 * @param {string} params.originalCode
 * @param {number} params.offset
 * @param {string} params.filePath
 * @param {string} params.rootPath
 * @returns {string}
 */
function generateSourceMapForOffset({
  originalCode,
  offset,
  filePath,
  rootPath,
}) {
  if (offset < 0) {
    throw new Error("Offset must not be negative");
  }

  let mappings = "";

  mappings += ";".repeat(offset);

  const originalLineCount = originalCode.split("\n").length;

  if (originalLineCount > 0) {
    mappings += "AAAA";
  }

  if (originalLineCount > 1) {
    mappings += ";AACA".repeat(originalLineCount - 1);
  }

  const filename = filePath
    .replace(rootPath, "")
    .replace(/\\/g, "/")
    .replace(/^\//, "");

  return JSON.stringify({
    version: 3,
    file: filename,
    sources: [filename],
    sourceRoot: `/${rootPath}`,
    sourcesContent: [originalCode],
    mappings,
  });
}
