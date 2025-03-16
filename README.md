![Bikbok](https://github.com/user-attachments/assets/b8742dea-a018-4d27-9454-95ff64661a4b)

### Modular build system for web projects 📦

## Goals

* This project follows my [Wheel Reinventor's Principles](https://github.com/tobloef/wheel-reinventors-principles): In short, it's made from scratch for learning and to tailor it to my specific use cases.
* **Extensible:** Must be usable across multiple projects, with the possibility of creating project-specific extensions.
* **Vanilla:** Written in JavaScript with [JSDoc](https://github.com/jsdoc/jsdoc) annotations for type checking, no transpilation step necessary.
* **Minimalistic:** Keep the build process simple, avoid too many layers between your code and the browser.

> [!WARNING]
> This project was created primarily for personal use. For this reason, it is not fully documented and I would not recommend using it. That said, I hope it can at least be inspirational for your own projects!

## Features

* Configuration-driven pipelines ([see example pipelines](https://github.com/tobloef/bikbok/tree/main/src/preset/presets)).
* Extensible module system ([list of built-in modules](https://github.com/tobloef/bikbok/tree/main/src/module/modules)).
* Build once or continuously watch for changes.
* Dev server for serving built files over HTTP and communicating build-events over WebSockets.
* Hot reloading of JavaScript modules and other assets ([more details](https://github.com/tobloef/hot-reload)).
* Generate [import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) for `node_modules` so they can be imported without any bundling step.

## Installation

```shell
npm install --save "git+https://git@github.com/tobloef/bikbok.git#v1.7.0"
```

## Usage

```shell
bikbok [build-config] [--watch] [--serve] [--open] [--verbose] [--quiet]
```

If a build config is not specified, bikbok will attempt to read `build-config.js` from the working directory. If this file doesn't exist, a build config _must_ be specified as a CLI option. You can either specify a path to a build config JavaScript file or use one of the [presets](https://github.com/tobloef/bikbok/blob/main/src/presets/index.js) (e.g. `bikbok presets/github-pages`).

The available flags are:
* `--watch` Continuously watch for changes and automatically rebuild.
* `--serve` Start the dev server and serve the build.
* `--open` Open the dev server's URL in the default browser.
* `--verbose` Log a lot of extra information.
* `--quiet` Only log errors.

## Limitations

* Known issue: If circular import is encountered during when hot module reloading is enabled, the page will not load.
