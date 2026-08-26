/**
 * Node's CommonJS loader has no handler for image extensions, so a plain
 * `require('trail-01.jpg')` falls through to the default (JS) handler and crashes
 * trying to execute raw JPEG bytes as a script. Metro (the app's real bundler)
 * handles this for free; a Node script run through tsx does not.
 *
 * seed-trails.ts and simulate-hiker.ts both import frontend/src/data/trails.ts for its data
 * only and already discard the `photo` field, so this just makes that require a
 * no-op (the file path, unused) instead of a crash. Import this before anything
 * that transitively imports frontend/src/data/trails.ts.
 */
import Module from 'node:module';

function stubAsset(mod: NodeModule, filename: string) {
  mod.exports = filename;
}

for (const ext of ['.png', '.jpg', '.jpeg']) {
  // Module._extensions is the same undocumented-but-stable registry ts-node and
  // other Node-based tools use for exactly this kind of asset stubbing.
  (Module as unknown as { _extensions: Record<string, typeof stubAsset> })._extensions[ext] =
    stubAsset;
}
