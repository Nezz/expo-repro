// Generates one JS file that looks like a Metro dev bundle: N module factory
// functions registered up front, then required in order at startup. With lazy
// compilation, each factory is compiled on its first call. Every module exports
// one default object, a few small functions and, optionally, L extra object
// literals. The literal keys embed the module and literal index, so no two
// literals share a shape.
//
// Usage: node gen-bench.mjs <modules> <literalsPerModule> > bench.js
// Run:   hermes -lazy bench.js
const range = (n) => Array.from({ length: n }, (_, i) => i);

const COUNT = Number(process.argv[2] ?? 12000);
const LITERALS = Number(process.argv[3] ?? 0);
// With 'shared', every module's j-th literal uses the same key names, so the
// shapes repeat across modules and only differ within one module.
const SHARED = process.argv[4] === 'shared';
const key = (i, j, s) => (SHARED ? `k${j}_${s}` : `k${i}_${j}_${s}`);

const out = [];
out.push('var __start = Date.now();');
out.push('var __modules = new Array(' + COUNT + ');');
out.push('var __cache = new Array(' + COUNT + ');');
out.push('function __r(i) { var c = __cache[i]; if (c) return c; var m = { exports: {} }; __cache[i] = m; __modules[i](m, m.exports, __r); return m; }');

for (const i of range(COUNT)) {
  const literals = range(LITERALS)
    .map(
      (j) =>
        `  var shape${i}_${j} = { ${key(i, j, 'a')}: ${i}, ${key(i, j, 'b')}: 'v${i}', ${key(i, j, 'c')}: ${j % 2 === 0}, ${key(i, j, 'd')}: [${i}, ${j}] };\n` +
        `  exports.shape${i}_${j} = shape${i}_${j};\n`,
    )
    .join('');
  out.push(`__modules[${i}] = function (module, exports, require) {
  var defaults${i} = { id: ${i}, label: 'module-${i}', enabled: ${i % 2 === 0}, weights: [${range(8).map((w) => i + w).join(', ')}] };
  function scale${i}(x) { var y = x + ${i}; y = y * 2 - ${i}; return y ^ ${i % 97}; }
  function combine${i}(values) { var total = 0; for (var k = 0; k < values.length; k++) total += scale${i}(values[k]); return total; }
  function describe${i}(options) { options = options || defaults${i}; return [options.label, String(options.id), options.enabled ? 'on' : 'off'].join(':'); }
${literals}  exports.defaults${i} = defaults${i};
  exports.scale${i} = scale${i};
  exports.combine${i} = combine${i};
  exports.describe${i} = describe${i};
};`);
}

out.push('var __deciles = []; var __t = Date.now();');
out.push('for (var i = 0; i < ' + COUNT + '; i++) { __r(i); if ((i + 1) % ' + Math.ceil(COUNT / 10) + ' === 0) { var __n = Date.now(); __deciles.push(__n - __t); __t = __n; } }');
out.push(
  "print(JSON.stringify({ modules: " +
    COUNT +
    ', literalsPerModule: ' +
    LITERALS +
    ', sharedShapes: ' +
    SHARED +
    ', evaluatedMs: Date.now() - __start, msPerDecile: __deciles }));',
);
process.stdout.write(out.join('\n') + '\n');
