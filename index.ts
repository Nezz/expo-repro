/* eslint-disable @typescript-eslint/no-require-imports */
// require rather than import, because imports are hoisted and this timestamp has
// to be taken before the app's import graph is evaluated.
(globalThis as { __jsStart?: number }).__jsStart = Date.now();

const { registerRootComponent } = require('expo');
const App = require('./App').default;

registerRootComponent(App);
