import { BuildConfig } from "../../build-config.js";
import {
  Copy,
  ImportMaps,
  Execute,
} from "../../module/index.js";
import { Clean } from "../../module/modules/clean.js";

const githubPages = new BuildConfig({
  modules: [
    new Clean({
      path: "docs",
    }),
    new Copy({
      from: "src",
      to: "docs",
      exclude: [/[\/\\]node_modules[\\\/]/],
    }),
    new Copy({
      from: ".",
      to: "docs",
      include: [/^package\.json$/],
      exclude: [/[\/\\]node_modules[\\\/]/],
      middleware: (input) => {
        // Remove devDependencies from package.json
        const packageJson = JSON.parse(input.toString());
        delete packageJson.devDependencies;
        return Buffer.from(JSON.stringify(packageJson, null, 2));
      }
    }),
    new Execute({
      path: "docs",
      command: "npm ci --omit=dev --install-links"
    }),
    new ImportMaps({
      write: true,
      packagePath: "docs",
      path: "docs",
      exclude: [/[\/\\]node_modules[\\\/]/],
      include: [/\.html$/],
    }),
  ],
});

export default githubPages;
