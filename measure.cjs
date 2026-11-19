// Preloaded into `expo start`: prints the CLI's heap after a forced GC every 5 s.
const { isMainThread } = require('node:worker_threads');
if (isMainThread && /[/\\]expo(\.js)?$|@expo[/\\]cli/.test(process.argv[1] ?? '')) {
  const start = Date.now();
  setInterval(() => {
    global.gc();
    const { heapUsed } = process.memoryUsage();
    console.log(`[heap] ${Math.round((Date.now() - start) / 1000)}s ${Math.round(heapUsed / 1e6)} MB`);
  }, 5_000).unref();
}
