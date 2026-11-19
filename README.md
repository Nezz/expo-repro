# API route that imports a `'use client'` module leaks the dev server's heap

With `web.output: "server"` and `experiments.reactServerFunctions: true`, each request to an API route whose bundle reaches a `'use client'` module keeps about 5 MB on the `expo start` heap, until it runs out of memory.

- `app/api/leak+api.js` imports `components/Client.js`, which starts with `'use client'`.
- `app/api/plain+api.js` imports nothing.

## Environment

@expo/cli 58.1.21, expo 58.0.26, expo-router 58.0.32, react-server-dom-webpack 19.3.1, Node 26.10.0, macOS 26.7.1.

## Steps

```sh
bun install
NODE_OPTIONS="--expose-gc --require ./measure.cjs" npx expo start --port 8095
```

`measure.cjs` prints the CLI's heap after a forced GC every 5 s. In a second terminal:

```sh
PORT=8095 ./hammer.sh plain 50
PORT=8095 ./hammer.sh leak 50
PORT=8095 ./hammer.sh leak 50
```

## Result

Heap after a forced GC:

| Step | Heap | With the workaround below |
|---|---|---|
| Start (one request to each route) | 48 MB | 48 MB |
| After 50 requests to `/api/plain` | 50 MB | 45 MB |
| After 50 requests to `/api/leak` | 295 MB | 46 MB |
| After 100 requests to `/api/leak` | 545 MB | 45 MB |

**Expected:** the heap stays flat for both routes.
**Actual:** it grows by about 5 MB per request to `/api/leak` and is never freed.

## Cause

1. `ssrImportApiRoute` (`@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js`) evaluates the route bundle again on every request (`evalMetroNoHandling` with `cache: false` in `getStaticRenderFunctions.js`).
2. The `'use client'` reference loads `react-server-dom-webpack/server`, whose development build (`react-server-dom-webpack-server.*.development.js`) wraps each `console` method in `patchConsole` when it loads, and each wrapper calls the method that was there before it.
3. Each evaluation adds one wrapper to the chain, so `console` keeps every evaluated copy of the bundle alive.

## Workaround

Restore the console after the evaluation in `ssrImportApiRoute`:

```js
const consoleBeforeEval = Object.getOwnPropertyDescriptors(console);
try {
    return (0, _getStaticRenderFunctions.evalMetroNoHandling)(this.projectRoot, apiRoute.src, apiRoute.filename, apiRoute.map);
} finally {
    Object.defineProperties(console, consoleBeforeEval);
}
```
