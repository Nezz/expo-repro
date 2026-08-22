// Pins the Hermes engine to the build that contains the lazy-compilation fix
// (facebook/hermes 00d37b91, shipped in hermes-engine 250829098.0.17).
//
// Both the Android gradle plugin (ReactPlugin.kt) and the iOS podspec read the
// version out of this file, so patching it is enough to swap the engine on both
// platforms. Runs from postinstall because it lives in node_modules.
import { readFileSync, writeFileSync } from 'fs';

const VERSION = '250829098.0.17';
const FILE = 'node_modules/react-native/sdks/hermes-engine/version.properties';

const before = readFileSync(FILE, 'utf8');
const after = before.replace(/^HERMES_V1_VERSION_NAME=.*$/m, `HERMES_V1_VERSION_NAME=${VERSION}`);

if (!/^HERMES_V1_VERSION_NAME=/m.test(before)) {
  throw new Error(`No HERMES_V1_VERSION_NAME in ${FILE}`);
}

writeFileSync(FILE, after);
console.log(
  before === after
    ? `hermes-engine already pinned to ${VERSION}`
    : `hermes-engine pinned to ${VERSION}`
);
