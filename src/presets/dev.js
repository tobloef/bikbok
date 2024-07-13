import {BuildConfig, ServeOptions} from "../build-config.js";

const githubPages = new BuildConfig({
  watch: true,
  serve: new ServeOptions({
    directory: ".",
    hot: true,
    live: true,
  }),
});

export default githubPages;
