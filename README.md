# Object literals make Hermes lazy compilation quadratic

Standalone reproduction of the startup slowdown left over at the end of
[expo/expo#48298](https://github.com/expo/expo/issues/48298). No React Native,
no Expo, no device: just a generated JS file shaped like a Metro dev bundle,
run with the `hermes` CLI under forced lazy compilation.

## Build the CLI

```bash
git clone --depth 1 --branch hermes-v250829098.0.17 https://github.com/facebook/hermes.git
cmake -S hermes -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build --target hermes
```

## Generate and run

```bash
node gen-bench.mjs 24000 0 > bench-24000-0.js
node gen-bench.mjs 24000 8 > bench-24000-8.js
build/bin/hermes -lazy -g3 bench-24000-0.js
build/bin/hermes -lazy -g3 bench-24000-8.js
```

`gen-bench.mjs <modules> <literalsPerModule> [shared]` generates a bundle with
`modules` factory functions, registered up front and then required in order, so
each one is lazily compiled on its first call — the same way a Metro dev bundle
loads modules at startup. Each module exports one default object and three small
functions, plus `literalsPerModule` extra object literals. The literal keys
embed the module and literal index, so every literal has a distinct shape. With
`shared`, the keys embed only the literal index, so the same shapes repeat in
every module.

The script prints the total evaluation time and the time spent on each tenth of
the modules. If the per-decile times keep growing through the run, the total
cost is quadratic.

## Results

Evaluation time on an Apple M-series machine, `hermes-v250829098.0.17`,
`-lazy -g3`:

| modules | 0 literals | 8 literals |
| --- | --- | --- |
| 3,000 | 99 ms | 345 ms |
| 6,000 | 205 ms | 804 ms |
| 12,000 | 469 ms | 2,064 ms |
| 24,000 | 1,195 ms | 5,121 ms |
| 48,000 | 2,876 ms | 13,965 ms |

Per decile at 24,000 modules:

| | ms per decile (first → last) |
| --- | --- |
| 0 literals | 77, 82, 86, 90, 93, 96, 105, 103, 183, 119 |
| 8 literals, distinct shapes | 256, 361, 431, 455, 458, 521, 537, 655, 559, 697 |
| 8 literals, shapes repeated across modules | 192, 213, 266, 236, 283, 323, 265, 374, 290, 304 |

The debug level makes no difference (`-g0` through `-g3` all land at 4.8–5.4 s
for 24,000 × 8). Without `-lazy`, the same files run in 31–280 ms.
